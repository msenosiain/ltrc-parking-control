import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { ExcelService } from '../common/services/excel.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotFoundException } from '@nestjs/common';

describe('MembersController', () => {
  let controller: MembersController;
  let membersService: MembersService;
  let excelService: ExcelService;

  const mockMembersService = {
    create: jest.fn(),
    getPaginated: jest.fn(),
    searchByDni: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMembers: jest.fn(),
    createMembersBulk: jest.fn().mockResolvedValue({ inserted: [{ _id: '1' }], failures: [] }),
  };

  const mockExcelService = {
    readExcelBuffer: jest.fn().mockReturnValue([{ nombre: 'A B', dni: '123' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
        {
          provide: ExcelService,
          useValue: mockExcelService,
        },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);
    membersService = module.get<MembersService>(MembersService);
    excelService = module.get<ExcelService>(ExcelService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call membersService.create', async () => {
      const dto = { fullName: 'John', dni: '123' };
      await controller.create(dto);
      expect(membersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('getMembers', () => {
    it('should call membersService.getPaginated', async () => {
      const dto: PaginationDto = { page: 1, limit: 10 };
      await controller.getMembers(dto);
      expect(membersService.getPaginated).toHaveBeenCalledWith(dto);
    });
  });

  describe('searchByDni', () => {
    it('should return member if found', async () => {
      const mockMember = { dni: '123' };
      mockMembersService.searchByDni.mockResolvedValue(mockMember);
      const result = await controller.searchByDni('123');
      expect(result).toBe(mockMember);
    });

    it('should throw NotFoundException if not found', async () => {
      mockMembersService.searchByDni.mockResolvedValue(null);
      await expect(controller.searchByDni('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadFile', () => {
    it('should parse excel and call createMembers', async () => {
      const mockBuffer = Buffer.from('mock');
      const mockData = [{ nombre: 'John', dni: '123' }];
      mockExcelService.readExcelBuffer.mockReturnValue(mockData);
      
      await controller.uploadFile({ buffer: mockBuffer });

      expect(excelService.readExcelBuffer).toHaveBeenCalledWith(mockBuffer);
      expect(membersService.createMembersBulk).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should call membersService.update', async () => {
      const dto = { fullName: 'Jane' };
      await controller.update('id', dto);
      expect(membersService.update).toHaveBeenCalledWith('id', dto);
    });
  });

  describe('delete', () => {
    it('should call membersService.delete', async () => {
      await controller.delete('id');
      expect(membersService.delete).toHaveBeenCalledWith('id');
    });
  });
});
