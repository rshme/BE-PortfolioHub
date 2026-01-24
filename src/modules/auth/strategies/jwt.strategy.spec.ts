import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/auth.interface';
import { UserRole } from '../../../common/enums/user-role.enum';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let authService: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedPassword',
    fullName: 'Test User',
    role: UserRole.VOLUNTEER,
    avatarUrl: null,
    bio: null,
    socialLinks: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-key';
      return null;
    }),
  };

  const mockAuthService = {
    validateUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: UserRole.VOLUNTEER,
    };

    it('should validate and return user when user exists', async () => {
      mockAuthService.validateUserById.mockResolvedValue(mockUser);

      const result = await jwtStrategy.validate(payload);

      expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockAuthService.validateUserById.mockResolvedValue(null);

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        'User tidak ditemukan atau tidak valid',
      );
    });

    it('should call validateUserById with correct user id from payload', async () => {
      mockAuthService.validateUserById.mockResolvedValue(mockUser);

      await jwtStrategy.validate(payload);

      expect(authService.validateUserById).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });

    it('should handle different user roles', async () => {
      const mentorPayload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRole.MENTOR,
      };

      const mentorUser = { ...mockUser, role: UserRole.MENTOR };
      mockAuthService.validateUserById.mockResolvedValue(mentorUser);

      const result = await jwtStrategy.validate(mentorPayload);

      expect(result.role).toBe(UserRole.MENTOR);
    });

    it('should propagate errors from authService', async () => {
      const error = new Error('Database error');
      mockAuthService.validateUserById.mockRejectedValue(error);

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(error);
    });
  });

  describe('constructor', () => {
    it('should initialize with JWT secret from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should have correct strategy configuration', () => {
      // Strategy is properly configured via super() call
      expect(jwtStrategy).toBeDefined();
    });
  });
});
