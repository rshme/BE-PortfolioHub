import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CloudinaryService } from '../../config/cloudinary.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.VOLUNTEER,
    avatarUrl: null,
    bio: null,
    socialLinks: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByIdOrFail: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    extractPublicId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = {
        user: { id: mockUser.id },
      };

      mockUsersService.findByIdOrFail.mockResolvedValue(mockUser);

      const result = await usersController.getProfile(mockRequest);

      expect(usersService.findByIdOrFail).toHaveBeenCalledWith(mockUser.id);
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result.data).toMatchObject({
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    it('should return user without password', async () => {
      const mockRequest = {
        user: { id: mockUser.id },
      };

      mockUsersService.findByIdOrFail.mockResolvedValue(mockUser);

      const result = await usersController.getProfile(mockRequest);

      expect(result.data).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockRequest = {
        user: { id: 'non-existent-id' },
      };

      mockUsersService.findByIdOrFail.mockRejectedValue(
        new NotFoundException('User tidak ditemukan'),
      );

      await expect(usersController.getProfile(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.getProfile(mockRequest)).rejects.toThrow(
        'User tidak ditemukan',
      );
    });

    it('should use user id from request object', async () => {
      const userId = '456e4567-e89b-12d3-a456-426614174001';
      const mockRequest = {
        user: { id: userId },
      };

      mockUsersService.findByIdOrFail.mockResolvedValue({
        ...mockUser,
        id: userId,
      });

      await usersController.getProfile(mockRequest);

      expect(usersService.findByIdOrFail).toHaveBeenCalledWith(userId);
    });

    it('should propagate errors from service', async () => {
      const mockRequest = {
        user: { id: mockUser.id },
      };

      const error = new Error('Database error');
      mockUsersService.findByIdOrFail.mockRejectedValue(error);

      await expect(usersController.getProfile(mockRequest)).rejects.toThrow(
        error,
      );
    });
  });

  describe('endpoint metadata', () => {
    it('should have correct route path', () => {
      const metadata = Reflect.getMetadata(
        'path',
        UsersController.prototype.getProfile,
      );
      expect(metadata).toBeDefined();
    });

    it('should require authentication', () => {
      // JwtAuthGuard decorator is tested via metadata
      const guards = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.getProfile,
      );
      expect(guards).toBeDefined();
    });
  });
});
