import { Test, TestingModule } from '@nestjs/testing';
import { AccessLogController } from './access-log.controller';
import { AccessLogService } from './access-log.service';

describe('AccessLogController', () => {
  let controller: AccessLogController;
  let service: AccessLogService;

  const mockAccessLogService = {
    registerAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessLogController],
      providers: [
        { provide: AccessLogService, useValue: mockAccessLogService },
      ],
    }).compile();

    controller = module.get<AccessLogController>(AccessLogController);
    service = module.get<AccessLogService>(AccessLogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerAccess', () => {
    it('should call service.registerAccess with DNI', async () => {
      const dniDto = { dni: '12345678' };
      await controller.registerAccess(dniDto);
      expect(service.registerAccess).toHaveBeenCalledWith(dniDto.dni);
    });
  });
});
