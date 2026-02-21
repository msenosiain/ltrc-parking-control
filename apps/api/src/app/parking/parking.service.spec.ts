import { Test, TestingModule } from '@nestjs/testing';
import { ParkingService } from './parking.service';
import { getModelToken } from '@nestjs/mongoose';
import { Parking } from './schemas/parking.schema';
import { ConfigService } from '@nestjs/config';

describe('ParkingService', () => {
  let service: ParkingService;
  let model: any;

  const mockParking = {
    total: 50,
    occupied: 10,
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingService,
        {
          provide: getModelToken(Parking.name),
          useValue: {
            countDocuments: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(50) },
        },
      ],
    }).compile();

    service = module.get<ParkingService>(ParkingService);
    model = module.get(getModelToken(Parking.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create initial parking config if not exists', async () => {
      model.countDocuments.mockResolvedValue(0);
      await service.onModuleInit();
      expect(model.create).toHaveBeenCalledWith({ total: 50, occupied: 0 });
    });
  });

  describe('getStatus', () => {
    it('should return parking status', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockParking) });
      const result = await service.getStatus();
      expect(result).toEqual({ total: 50, occupied: 10, available: 40 });
    });
  });

  describe('carEnters', () => {
    it('should increment occupied count if spaces available', async () => {
      const parking = { ...mockParking, occupied: 10, save: jest.fn() };
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(parking) });
      
      await service.carEnters();
      expect(parking.occupied).toBe(11);
      expect(parking.save).toHaveBeenCalled();
    });

    it('should not increment if full', async () => {
      const parking = { ...mockParking, occupied: 50, save: jest.fn() };
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(parking) });
      
      await service.carEnters();
      expect(parking.occupied).toBe(50);
      expect(parking.save).not.toHaveBeenCalled();
    });
  });

  describe('carLeaves', () => {
    it('should decrement occupied count if > 0', async () => {
      const parking = { ...mockParking, occupied: 10, save: jest.fn() };
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(parking) });
      
      await service.carLeaves();
      expect(parking.occupied).toBe(9);
      expect(parking.save).toHaveBeenCalled();
    });
  });
});
