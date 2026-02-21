import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@test.com',
    name: 'Test',
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    constructor: jest.fn().mockImplementation(function (dto) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'newId' }),
      };
    }),
  };

  // Necesario para que el constructor funcione como mock de clase de Mongoose
  function MockModel(dto: any) {
    this.data = dto;
    this.save = jest.fn().mockResolvedValue({ ...dto, _id: 'newId' });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
    
    // Añadimos mocks a las funciones estáticas del modelo
    (model as any).findOne = jest.fn();
    (model as any).findById = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByGoogleId', () => {
    it('should call findOne with correct filter', async () => {
      const exec = jest.fn().mockResolvedValue(mockUser);
      (model.findOne as jest.Mock).mockReturnValue({ exec });

      const result = await service.findOneByGoogleId('googleId');

      expect(model.findOne).toHaveBeenCalledWith({ googleId: 'googleId' });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByEmail', () => {
    it('should call findOne and include password if requested', async () => {
      const select = jest.fn().mockReturnThis();
      const exec = jest.fn().mockResolvedValue(mockUser);
      (model.findOne as jest.Mock).mockReturnValue({ select, exec });

      await service.findOneByEmail('test@test.com', true);

      expect(model.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(select).toHaveBeenCalledWith('+password');
    });
  });

  describe('findById', () => {
    it('should call findById', async () => {
      const exec = jest.fn().mockResolvedValue(mockUser);
      (model.findById as jest.Mock).mockReturnValue({ exec });

      await service.findById('someId');

      expect(model.findById).toHaveBeenCalledWith('someId');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = { email: 'new@test.com', name: 'New' };
      const result = await service.create(userData);

      expect(result).toHaveProperty('_id', 'newId');
      expect(result.email).toBe(userData.email);
    });
  });
});
