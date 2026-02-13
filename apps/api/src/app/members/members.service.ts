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

  async delete(id: string): Promise<Member | null> {
    return this.memberModel.findByIdAndDelete(id).exec();
  }
}
