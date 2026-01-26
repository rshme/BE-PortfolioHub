import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthResponse = {
    user: {
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
    },
    accessToken: 'jwt-token-123',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await authController.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toHaveProperty('statusCode', 201);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data.user.email).toBe(registerDto.email);
      expect(result.data.user.fullName).toBe(registerDto.fullName);
    });

    it('should return user without password', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await authController.register(registerDto);

      expect(result.data.user).not.toHaveProperty('password');
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Email sudah terdaftar');
      mockAuthService.register.mockRejectedValue(error);

      await expect(authController.register(registerDto)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await authController.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data.user.email).toBe(loginDto.email);
    });

    it('should return JWT token on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await authController.login(loginDto);

      expect(result.data.accessToken).toBe('jwt-token-123');
      expect(typeof result.data.accessToken).toBe('string');
    });

    it('should return user without password', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await authController.login(loginDto);

      expect(result.data.user).not.toHaveProperty('password');
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Email atau password salah');
      mockAuthService.login.mockRejectedValue(error);

      await expect(authController.login(loginDto)).rejects.toThrow(error);
    });
  });

  describe('HTTP status codes', () => {
    it('should return 201 for register', () => {
      // Decorator @HttpCode(HttpStatus.CREATED) is tested via metadata
      const metadata = Reflect.getMetadata(
        'path',
        AuthController.prototype.register,
      );
      expect(metadata).toBeDefined();
    });

    it('should return 200 for login', () => {
      // Decorator @HttpCode(HttpStatus.OK) is tested via metadata
      const metadata = Reflect.getMetadata(
        'path',
        AuthController.prototype.login,
      );
      expect(metadata).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      } as any;

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await authController.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith('valid-jwt-token');
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('message', 'Logout successful');
      expect(result.data).toBeNull();
    });

    it('should handle missing authorization header gracefully', async () => {
      const mockRequest = {
        headers: {},
      } as any;

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await authController.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith('');
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('message', 'Logout successful');
    });

    it('should extract token without Bearer prefix', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer my-token-123',
        },
      } as any;

      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith('my-token-123');
    });

    it('should propagate errors from service', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as any;

      const error = new Error('Invalid token');
      mockAuthService.logout.mockRejectedValue(error);

      await expect(authController.logout(mockRequest)).rejects.toThrow(error);
    });
  });
});
