import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/schemas/user.schema';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersService: UsersService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@test.com',
    password: 'hashedPassword',
    name: 'Test',
    lastName: 'User',
    roles: ['user'],
  } as unknown as User;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mockToken'),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, defaultValue) => defaultValue),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      await expect(service.register({ email: 'test@test.com' })).rejects.toThrow(ConflictException);
    });

    it('should hash password and create user', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register({ email: 'test@test.com', password: 'password' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(usersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      await expect(service.login('test@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login('test@test.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if login is successful', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@test.com', 'hashedPassword');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token', () => {
      const result = service.refreshToken(mockUser);
      expect(result).toHaveProperty('access_token');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });
});
