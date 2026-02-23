import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from './schemas/member.schema';
import { Model } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { resolveQuery, escapeRegex } from '@parking-control/shared';

@Injectable()
export class MembersService {
  constructor(@InjectModel(Member.name) private readonly memberModel: Model<Member>) {}

  async findAll(): Promise<Member[]> {
    return await this.memberModel.find().select('-_id').exec();
  }

  async get(id: string): Promise<Member | null> {
    return await this.memberModel.findById(id).exec();
  }

  async getPaginated(paginationDto: PaginationDto) {
    const { query, page, limit, sortBy, sortOrder } = paginationDto;

    // normalize it and prefer an anchored regex or exact match so Mongo can use the DNI index.
    let searchQuery: any = {};
    if (query) {
      const maybeDni = String(query).replace(/[^0-9]/g, '').trim();
      const nameRegex = { fullName: { $regex: `^${escapeRegex(String(query))}`, $options: 'i' } };

      if (maybeDni.length >= 2) {
        // for short numeric inputs use prefix match anchored at start (index-friendly)
        const dniRegex = { dni: { $regex: `^${maybeDni}`, $options: 'i' } };
        searchQuery = { $or: [nameRegex, dniRegex] };
      } else {
        // default behavior: search name (anchored) and dni as case-insensitive regex
        searchQuery = { $or: [nameRegex, { dni: { $regex: escapeRegex(String(query)), $options: 'i' } }] };
      }
    }

    const sortField = sortBy || 'fullName';
    const order = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Use lean() for faster read and lower memory overhead
    const membersQuery = this.memberModel.find(searchQuery).skip(skip).limit(limit).sort({ [sortField]: order });
    const [members, total] = await Promise.all([resolveQuery<any[]>(membersQuery), this.memberModel.countDocuments().exec()]);

    return {
      data: members,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async searchByDni(dni: string): Promise<Member | null> {
    if (!dni) return null;
    // normalize digits only
    const normalized = String(dni).replace(/[^0-9]/g, '').trim();

    // If the normalized string length matches a typical DNI length (or seems complete), try exact match first.
    if (normalized.length >= 6) {
      const exactQuery = this.memberModel.findOne({ dni: normalized }).select('-_id');
      const exact = await resolveQuery<any>(exactQuery);
      if (exact) return exact as any;
    }

    // Fallback to prefix (anchored) search which can use the index
    const prefix = normalized || escapeRegex(String(dni));
    const q: any = { dni: { $regex: `^${prefix}`, $options: 'i' } };
    const foundQuery = this.memberModel.findOne(q).select('-_id');
    const found = await resolveQuery<any>(foundQuery);
    return found as any;
  }

  async create(dto: CreateMemberDto): Promise<Member> {
    return await this.memberModel.create(dto);
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.memberModel.findByIdAndUpdate(
      id,
      updateMemberDto,
      {
        new: true,
      },
    );
    if (!member) {
      throw new NotFoundException(`Member #${id} not found`);
    }
    return member;
  }

  async createMembers(members: Member[]): Promise<Member[]> {
    return await this.memberModel.insertMany(members);
  }

  /**
   * Bulk insert members but continue on any error. Returns inserted docs and failures with context.
   * This implementation optimizes by:
   * - normalizing DNIs once
   * - detecting duplicates inside the upload
   * - checking existing DNIs in a single DB query
   * - performing unordered bulkWrite in configurable chunks
   */
  async createMembersBulk(members: Partial<Member>[]): Promise<{ inserted: { dni: string; fullName: string }[]; failures: { index?: number; dni?: string; fullName?: string; message: string; rowNumber?: number }[] }> {
    const failures: { index?: number; dni?: string; fullName?: string; message: string; rowNumber?: number }[] = [];
    const inserted: { dni: string; fullName: string }[] = [];

    if (!Array.isArray(members) || members.length === 0) {
      return { inserted, failures };
    }

    // Step 1: normalize and basic validation
    type Candidate = { originalIndex: number; rowNumber: number; rawDni?: any; fullName?: any; dni?: string };
    const candidates: Candidate[] = [];

    for (let i = 0; i < members.length; i++) {
      const m = members[i] as any;
      const rowNumber = (m && (m.rowNumber || m.sourceRow)) ? Number(m.rowNumber || m.sourceRow) : i + 2; // default assume header row
      const rawDni = m?.dni ?? '';
      const fullName = m?.fullName ?? '';
      const dniNormalized = typeof rawDni === 'string' || typeof rawDni === 'number'
        ? String(rawDni).replace(/\.|\s|-/g, '').trim()
        : '';

      if (!dniNormalized || !String(fullName).trim()) {
        failures.push({ index: i, dni: dniNormalized || undefined, fullName: fullName ?? undefined, message: 'Fila inválida: nombre o DNI faltante', rowNumber });
        continue;
      }

      candidates.push({ originalIndex: i, rowNumber, rawDni, fullName: String(fullName).trim(), dni: dniNormalized });
    }

    if (candidates.length === 0) {
      return { inserted, failures };
    }

    // Step 2: detect duplicates within the uploaded file
    const dniCountMap = new Map<string, number>();
    for (const c of candidates) {
      dniCountMap.set(c.dni!, (dniCountMap.get(c.dni!) || 0) + 1);
    }
    const uniqueCandidates = [] as Candidate[];
    // If a DNI appears multiple times in the uploaded file, keep the first occurrence
    // and mark subsequent rows as failures (so at least one can be inserted).
    const seenDnis = new Set<string>();
    for (const c of candidates) {
      const count = dniCountMap.get(c.dni!) || 0;
      if (count > 1) {
        if (!seenDnis.has(c.dni!)) {
          // keep the first occurrence
          uniqueCandidates.push(c);
          seenDnis.add(c.dni!);
        } else {
          // subsequent occurrences marked as duplicate
          failures.push({ index: c.originalIndex, dni: c.dni, fullName: c.fullName, message: 'DNI duplicado en archivo', rowNumber: c.rowNumber });
        }
      } else {
        uniqueCandidates.push(c);
      }
    }

    if (uniqueCandidates.length === 0) {
      return { inserted, failures };
    }

    // If the model is a lightweight mock (tests) and doesn't implement find/bulkWrite, fallback to sequential create
    const hasFind = typeof (this.memberModel as any).find === 'function';
    const hasBulk = typeof (this.memberModel as any).bulkWrite === 'function';

    if (!hasFind || !hasBulk) {
      // Sequential path: try create per candidate and rely on thrown errors to detect duplicates
      for (const c of uniqueCandidates) {
        try {
          await (this.memberModel as any).create({ fullName: c.fullName, dni: c.dni });
          inserted.push({ dni: c.dni!, fullName: c.fullName! });
        } catch (err: any) {
          let msg = 'Error al insertar fila';
          if (err && (err.code === 11000 || (err.err && err.err.code === 11000))) {
            msg = 'DNI duplicado';
          } else if (err && err.message) {
            msg = err.message;
          }
          failures.push({ index: c.originalIndex, dni: c.dni, fullName: c.fullName, message: msg, rowNumber: c.rowNumber });
        }
      }

      return { inserted, failures };
    }

    // Step 3: query DB once for existing DNIs
    const dniList = uniqueCandidates.map((c) => c.dni);
    const existingQuery = this.memberModel.find({ dni: { $in: dniList } }).select('dni');
    const existingDocs = await resolveQuery<any[]>(existingQuery);
    const existingSet = new Set(existingDocs.map((d: any) => d.dni));

    const readyToInsert = uniqueCandidates.filter((c) => {
      if (existingSet.has(c.dni!)) {
        failures.push({ index: c.originalIndex, dni: c.dni, fullName: c.fullName, message: 'DNI duplicado', rowNumber: c.rowNumber });
        return false;
      }
      return true;
    });

    if (readyToInsert.length === 0) {
      return { inserted, failures };
    }

    // Step 4: perform bulkWrite in chunks
    const BATCH_SIZE = 500; // adjustable

    for (let i = 0; i < readyToInsert.length; i += BATCH_SIZE) {
      const batch = readyToInsert.slice(i, i + BATCH_SIZE);
      const ops = batch.map((c) => ({ insertOne: { document: { fullName: c.fullName, dni: c.dni } } }));

      try {
        const res: any = await (this.memberModel as any).bulkWrite(ops, { ordered: false });
        // res may contain insertedCount — infer successful ops by comparing
        const insertedCount = res.insertedCount || 0;
        // We can't get the actual docs from bulkWrite easily; return minimal records
        // Mark all batch entries as inserted, minus those that may have errors
        if (insertedCount === ops.length) {
          for (const c of batch) inserted.push({ dni: c.dni!, fullName: c.fullName! });
        } else {
          // Some inserts failed silently; we'll try to query which ones exist now
          const nowExistQuery = this.memberModel.find({ dni: { $in: batch.map(b => b.dni) } }).select('dni fullName');
          const nowExist = await resolveQuery<any[]>(nowExistQuery);
          const existSetNow = new Set(nowExist.map((d: any) => d.dni));
          for (const c of batch) {
            if (existSetNow.has(c.dni!)) {
              inserted.push({ dni: c.dni!, fullName: c.fullName! });
            } else {
              failures.push({ index: c.originalIndex, dni: c.dni, fullName: c.fullName, message: 'Error al insertar fila (posible conflicto)', rowNumber: c.rowNumber });
            }
          }
        }
      } catch (err: any) {
        // BulkWriteError thrown when there are writeErrors; still some ops may have succeeded
        // Parse err.writeErrors if present
        const writeErrors = err && err.writeErrors ? err.writeErrors : [];
        const failedOpIndexes = new Set<number>(writeErrors.map((we: any) => we.index));

        for (let j = 0; j < batch.length; j++) {
          const c = batch[j];
          if (failedOpIndexes.has(j)) {
            const we = writeErrors.find((x: any) => x.index === j);
            let msg = 'Error al insertar fila';
            if (we && we.err && we.err.code === 11000) {
              msg = 'DNI duplicado';
            } else if (we && we.err && we.err.errmsg) {
              msg = String(we.err.errmsg);
            } else if (we && we.err && we.err.message) {
              msg = String(we.err.message);
            }
            failures.push({ index: c.originalIndex, dni: c.dni, fullName: c.fullName, message: msg, rowNumber: c.rowNumber });
          } else {
            // assumed inserted
            inserted.push({ dni: c.dni!, fullName: c.fullName! });
          }
        }
      }
    }

    return { inserted, failures };
  }

  async delete(id: string): Promise<Member | null> {
    return this.memberModel.findByIdAndDelete(id).exec();
  }
}
