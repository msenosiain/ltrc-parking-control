import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let configService: ConfigService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    generateJwt: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const body = { email: 'test@test.com', pass: 'pass' };
      await controller.login(body);
      expect(authService.login).toHaveBeenCalledWith(body.email, body.pass);
    });
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const userData = { email: 'test@test.com', name: 'Test' };
      await controller.register(userData);
      expect(authService.register).toHaveBeenCalledWith(userData);
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect with tokens', async () => {
      const mockUser = { email: 'test@test.com' };
      const mockReq = { user: mockUser } as unknown as Request;
      const mockRes = { redirect: jest.fn() } as unknown as Response;
      const mockTokens = { access_token: 'at', refresh_token: 'rt' };
      
      mockAuthService.generateJwt.mockResolvedValue(mockTokens);
      mockConfigService.get.mockReturnValue('http://callback');

      await controller.googleAuthRedirect(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://callback?access_token=at&refresh_token=rt'
      );
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshToken', async () => {
      const mockUser = { email: 'test@test.com' };
      const mockReq = { user: mockUser } as unknown as Request;
      
      await controller.refreshTokens(mockReq);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
    });
  });
});
