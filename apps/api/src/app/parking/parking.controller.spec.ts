import { Test, TestingModule } from '@nestjs/testing';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';

describe('ParkingController', () => {
  let controller: ParkingController;
  let service: ParkingService;

  const mockParkingService = {
    getStatus: jest.fn(),
    carEnters: jest.fn(),
    carLeaves: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParkingController],
      providers: [
        { provide: ParkingService, useValue: mockParkingService },
      ],
    }).compile();

    controller = module.get<ParkingController>(ParkingController);
    service = module.get<ParkingService>(ParkingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should call service.getStatus', async () => {
      await controller.getStatus();
      expect(service.getStatus).toHaveBeenCalled();
    });
  });

  describe('carEnters', () => {
    it('should call service.carEnters', async () => {
      await controller.carEnters();
      expect(service.carEnters).toHaveBeenCalled();
    });
  });

  describe('carLeaves', () => {
    it('should call service.carLeaves', async () => {
      await controller.carLeaves();
      expect(service.carLeaves).toHaveBeenCalled();
    });
  });
});
