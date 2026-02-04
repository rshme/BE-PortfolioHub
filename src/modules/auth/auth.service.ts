import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { JwtPayload, AuthResponse } from './interfaces/auth.interface';
import { UserRole } from '../../common/enums/user-role.enum';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // UsersService will handle email & username conflict validation
    const user = await this.usersService.create(registerDto);

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async validateUserById(userId: string): Promise<User | null> {
    return await this.usersService.findById(userId);
  }

  /**
   * Logout user by blacklisting their JWT token
   * @param token - JWT token to blacklist
   */
  async logout(token: string): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        throw new UnauthorizedException('Invalid token');
      }

      // Calculate remaining TTL (time to live) in seconds
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - currentTime;

      // Only blacklist if token hasn't expired yet
      if (expiresIn > 0) {
        await this.tokenBlacklistService.addToBlacklist(token, expiresIn);
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }
}
