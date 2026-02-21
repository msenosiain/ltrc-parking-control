import { Test, TestingModule } from '@nestjs/testing';
import { AccessLogService } from './access-log.service';
import { getModelToken } from '@nestjs/mongoose';
import { AccessLogEntry } from './schemas/access-log-entry.schema';
import { MembersService } from '../members/members.service';
import { ConfigService } from '@nestjs/config';
import { addMinutes, subMinutes } from 'date-fns';

describe('AccessLogService', () => {
  let service: AccessLogService;
  let membersService: MembersService;
  let model: any;
  let configService: ConfigService;

  const mockMember = {
    dni: '12345678',
    fullName: 'John Doe',
  };

  const mockAccessLogEntryModel = {
    findOne: jest.fn(),
    constructor: jest.fn().mockImplementation(function (dto) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, createdAt: new Date() }),
      };
    }),
  };

  // Mock constructor for new this.accessLogEntryModel({ dni })
  function MockModel(dto: any) {
    this.dni = dto.dni;
    this.save = jest.fn().mockResolvedValue({ ...dto, createdAt: new Date() });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessLogService,
        {
          provide: getModelToken(AccessLogEntry.name),
          useValue: MockModel,
        },
        {
          provide: MembersService,
          useValue: { searchByDni: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(30) },
        },
      ],
    }).compile();

    service = module.get<AccessLogService>(AccessLogService);
    membersService = module.get<MembersService>(MembersService);
    model = module.get(getModelToken(AccessLogEntry.name));
    configService = module.get<ConfigService>(ConfigService);
    
    (model as any).findOne = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerAccess', () => {
    it('should deny access if member not found', async () => {
      (membersService.searchByDni as jest.Mock).mockResolvedValue(null);
      const result = await service.registerAccess('123');
      expect(result.accessGranted).toBe(false);
      expect(result.title).toBe('Acceso Denegado');
    });

    it('should deny access if threshold not met', async () => {
      (membersService.searchByDni as jest.Mock).mockResolvedValue(mockMember);
      const lastAccess = { createdAt: subMinutes(new Date(), 10) };
      const sort = jest.fn().mockResolvedValue(lastAccess);
      (model.findOne as jest.Mock).mockReturnValue({ sort });

      const result = await service.registerAccess('12345678');
      expect(result.accessGranted).toBe(false);
      expect(result.subtitle).toContain('debes esperar 30 minutos');
    });

    it('should grant access if threshold met or no previous access', async () => {
      (membersService.searchByDni as jest.Mock).mockResolvedValue(mockMember);
      const sort = jest.fn().mockResolvedValue(null); // No previous access
      (model.findOne as jest.Mock).mockReturnValue({ sort });

      const result = await service.registerAccess('12345678');
      expect(result.accessGranted).toBe(true);
      expect(result.subtitle).toBe('Acceso registrado con éxito');
    });
  });
});
