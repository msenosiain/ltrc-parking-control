import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from './schemas/member.schema';
import { Model } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

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

    const searchQuery = query
      ? {
          $or: [
            { fullName: { $regex: `^${query}`, $options: 'i' } },
            { dni: new RegExp(query, 'i') },
          ],
        }
      : {};

    const sortField = sortBy || 'fullName';
    const order = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.memberModel
        .find(searchQuery)
        .skip(skip)
        .limit(limit)
        .sort({ [sortField]: order })
        .exec(),
      this.memberModel.countDocuments().exec(),
    ]);

    return {
      data: members,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async searchByDni(dni: string): Promise<Member | null> {
    return await this.memberModel
      .findOne({ dni: new RegExp(dni, 'i') })
      .select('-_id')
      .exec();
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
   */
  async createMembersBulk(members: Partial<Member>[]): Promise<{ inserted: Member[]; failures: { index?: number; dni?: string; fullName?: string; message: string; rowNumber?: number }[] }> {
    const inserted: Member[] = [];
    const failures: { index?: number; dni?: string; fullName?: string; message: string; rowNumber?: number }[] = [];

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      try {
        // Normalize DNI: remove dots, spaces, and ensure string
        const rawDni = (m as any).dni ? String((m as any).dni) : '';
        const dniNormalized = rawDni.replace(/\.|\s|-/g, '').trim();
        // If no dni or fullName, mark as failure without attempting insert
        if (!dniNormalized || !((m as any).fullName && String((m as any).fullName).trim())) {
          failures.push({ index: i, dni: dniNormalized || undefined, fullName: (m as any).fullName ?? undefined, message: 'Fila inválida: nombre o DNI faltante', rowNumber: (m as any).rowNumber ?? i + 2 });
          continue;
        }

        // Check existing by normalized DNI to avoid duplicates on re-upload
         let existing: any = null;
         if (typeof (this.memberModel as any).findOne === 'function') {
           try {
            // Build a regex that matches the DNI digits with optional non-digit separators
            // e.g., '8456087' -> /^(8\D*4\D*5\D*6\D*0\D*8\D*7)$/
            const pattern = dniNormalized.split('').map((d: string) => `${d}\D*`).join('');
            const regex = new RegExp(`^${pattern}$`);
            const q = (this.memberModel as any).findOne({ dni: { $regex: regex } });
             if (q && typeof q.exec === 'function') {
               existing = await q.exec();
             } else {
               // some mocks return a direct value or promise
               existing = await q;
             }
           } catch (e) {
             // ignore errors from mock/driver and proceed to attempt create
             existing = null;
           }
         }
         if (existing) {
           failures.push({ index: i, dni: dniNormalized, fullName: (m as any).fullName ?? undefined, message: 'DNI duplicado', rowNumber: (m as any).rowNumber ?? i + 2 });
           continue;
         }

         // Create with normalized dni
         const doc = await this.memberModel.create({ fullName: String((m as any).fullName).trim(), dni: dniNormalized });
         inserted.push(doc);
      } catch (err: any) {
        // collect failure info but continue
        let msg = 'Error al insertar fila';
        let dniVal: string | undefined = undefined;
        try {
          dniVal = (m as any).dni?.toString();
        } catch {}
        let rowNumber: number | undefined = undefined;
        if ((m as any).sourceRow) {
          rowNumber = Number((m as any).sourceRow);
        } else {
          rowNumber = i + 2; // default: assume header at row 1, data starts at row 2
        }
        if (err && (err.code === 11000 || (err.err && err.err.code === 11000))) {
          msg = 'DNI duplicado';
          const keyValue = err.keyValue || (err.err && err.err.keyValue);
          if (keyValue) {
            dniVal = keyValue.dni ?? keyValue.DNI ?? dniVal;
          }
        } else if (err && err.message) {
          msg = err.message;
        }

        failures.push({ index: i, dni: dniVal, fullName: (m as any).fullName ?? undefined, message: msg, rowNumber });
      }
    }

    return { inserted, failures };
  }

  async delete(id: string): Promise<Member | null> {
    return this.memberModel.findByIdAndDelete(id).exec();
  }
}
