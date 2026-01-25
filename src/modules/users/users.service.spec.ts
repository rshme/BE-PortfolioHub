import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: Repository<User>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedPassword',
    fullName: 'Test User',
    role: UserRole.VOLUNTEER,
    avatarUrl: undefined,
    bio: undefined,
    socialLinks: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should successfully create a new user', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await usersService.create(createUserDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: '$2b$10$hashedPassword',
      });
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null); // email check
      mockRepository.findOne.mockResolvedValueOnce(mockUser); // username check

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await usersService.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: '$2b$10$hashedPassword',
        }),
      );
    });

    it('should create user with default role if not provided', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await usersService.create(createUserDto);

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          fullName: createUserDto.fullName,
        }),
      );
    });

    it('should create user with specified role', async () => {
      const createUserDtoWithRole: CreateUserDto = {
        ...createUserDto,
        role: UserRole.MENTOR,
      };

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');
      mockRepository.create.mockReturnValue({
        ...mockUser,
        role: UserRole.MENTOR,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        role: UserRole.MENTOR,
      });

      const result = await usersService.create(createUserDtoWithRole);

      expect(result.role).toBe(UserRole.MENTOR);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await usersService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        usersService.findByEmail('test@example.com'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByUsername', () => {
    it('should return user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByUsername('testuser');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await usersService.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(usersService.findByUsername('testuser')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findById(mockUser.id);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await usersService.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(usersService.findById(mockUser.id)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByIdOrFail', () => {
    it('should return user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByIdOrFail(mockUser.id);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        usersService.findByIdOrFail('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        usersService.findByIdOrFail('non-existent-id'),
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(usersService.findByIdOrFail(mockUser.id)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
