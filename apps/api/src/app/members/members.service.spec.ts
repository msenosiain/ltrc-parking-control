import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getModelToken } from '@nestjs/mongoose';
import { Member } from './schemas/member.schema';
import { NotFoundException } from '@nestjs/common';

describe('MembersService', () => {
  let service: MembersService;
  let model: any;

  const mockMember = {
    _id: 'memberId',
    fullName: 'John Doe',
    dni: '12345678',
  };

  const mockModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    insertMany: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getModelToken(Member.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    model = module.get(getModelToken(Member.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all members', async () => {
      const exec = jest.fn().mockResolvedValue([mockMember]);
      const select = jest.fn().mockReturnValue({ exec });
      model.find.mockReturnValue({ select });

      const result = await service.findAll();
      expect(result).toEqual([mockMember]);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('getPaginated', () => {
    it('should return paginated members', async () => {
      const execFind = jest.fn().mockResolvedValue([mockMember]);
      const sort = jest.fn().mockReturnValue({ exec: execFind });
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit });
      model.find.mockReturnValue({ skip });

      const execCount = jest.fn().mockResolvedValue(1);
      model.countDocuments.mockReturnValue({ exec: execCount });

      const result = await service.getPaginated({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockMember]);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
    });
  });

  describe('searchByDni', () => {
    it('should find a member by DNI', async () => {
      const exec = jest.fn().mockResolvedValue(mockMember);
      const select = jest.fn().mockReturnValue({ exec });
      model.findOne.mockReturnValue({ select });

      const result = await service.searchByDni('12345678');
      expect(result).toEqual(mockMember);
      expect(model.findOne).toHaveBeenCalledWith({ dni: expect.any(RegExp) });
    });
  });

  describe('update', () => {
    it('should update a member', async () => {
      model.findByIdAndUpdate.mockResolvedValue(mockMember);
      const result = await service.update('memberId', { fullName: 'Jane Doe' });
      expect(result).toEqual(mockMember);
    });

    it('should throw NotFoundException if member not found', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.update('invalidId', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a member', async () => {
      model.create.mockResolvedValue(mockMember);
      const result = await service.create({ fullName: 'John', dni: '123' });
      expect(result).toEqual(mockMember);
    });
  });

  describe('delete', () => {
    it('should delete a member', async () => {
      const exec = jest.fn().mockResolvedValue(mockMember);
      model.findByIdAndDelete.mockReturnValue({ exec });
      const result = await service.delete('memberId');
      expect(result).toEqual(mockMember);
    });
  });

  describe('createMembersBulk behavior', () => {
    it('continues on duplicate and returns failures with rowNumber', async () => {
      const service: any = require('./members.service').MembersService;
      // create a dummy instance
      const svc = new (service as any)();

      // mock memberModel.create
      svc['memberModel'] = {
        create: jest
          .fn()
          .mockResolvedValueOnce({ _id: '1', fullName: 'John Doe', dni: '1234567' })
          .mockRejectedValueOnce({ code: 11000, keyValue: { dni: '8456087' } })
          .mockResolvedValueOnce({ _id: '3', fullName: 'Alice Smith', dni: '7654321' }),
      };

      const members = [
        { fullName: 'John Doe', dni: '1234567' },
        { fullName: 'Existing User', dni: '8456087' },
        { fullName: 'Alice Smith', dni: '7654321' },
      ];

      const result = await svc.createMembersBulk(members as any);
      expect(result.inserted.length).toBe(2);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].dni).toBe('8456087');
      expect(result.failures[0].rowNumber).toBeDefined();
    });
  });
});
