import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let tokenBlacklistService: TokenBlacklistService;

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

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTokenBlacklistService = {
    addToBlacklist: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should successfully register a new user', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await authService.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        role: UserRole.VOLUNTEER,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email sudah terdaftar'),
      );

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        role: UserRole.VOLUNTEER,
      });
    });

    it('should throw ConflictException if username already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Username sudah digunakan'),
      );

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        role: UserRole.VOLUNTEER,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('validateUserById', () => {
    it('should return user if found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await authService.validateUserById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await authService.validateUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    const validToken = 'valid.jwt.token';

    it('should successfully logout with valid token', async () => {
      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      mockJwtService.decode.mockReturnValue(decodedToken);
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(undefined);

      await authService.logout(validToken);

      expect(jwtService.decode).toHaveBeenCalledWith(validToken);
      expect(tokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(
        validToken,
        expect.any(Number),
      );
    });

    it('should calculate correct TTL for token', async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 7200; // 2 hours from now

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: currentTime,
        exp: expiryTime,
      };

      mockJwtService.decode.mockReturnValue(decodedToken);
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(undefined);

      await authService.logout(validToken);

      expect(tokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(
        validToken,
        expect.any(Number),
      );

      // Verify TTL is reasonable (should be close to 2 hours = 7200 seconds)
      const callArgs = mockTokenBlacklistService.addToBlacklist.mock.calls[0];
      expect(callArgs[1]).toBeGreaterThan(7000);
      expect(callArgs[1]).toBeLessThanOrEqual(7200);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.decode.mockReturnValue(null);

      await expect(authService.logout(validToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.logout(validToken)).rejects.toThrow(
        'Invalid token',
      );
      expect(tokenBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for token without expiration', async () => {
      const invalidToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      mockJwtService.decode.mockReturnValue(invalidToken);

      await expect(authService.logout(validToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(tokenBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('should not blacklist expired token', async () => {
      const expiredToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      };

      mockJwtService.decode.mockReturnValue(expiredToken);

      await authService.logout(validToken);

      expect(jwtService.decode).toHaveBeenCalledWith(validToken);
      expect(tokenBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('should handle decode errors gracefully', async () => {
      mockJwtService.decode.mockImplementation(() => {
        throw new Error('Decode error');
      });

      await expect(authService.logout(validToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
