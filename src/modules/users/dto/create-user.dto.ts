import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email harus valid' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString({ message: 'Username harus berupa string' })
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @MaxLength(30, { message: 'Username maksimal 30 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username: string;

  @IsString({ message: 'Password harus berupa string' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsString({ message: 'Nama lengkap harus berupa string' })
  @MinLength(3, { message: 'Nama lengkap minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @IsEnum(UserRole, { message: 'Role tidak valid' })
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @MaxLength(500, { message: 'Bio maksimal 500 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @IsOptional()
  socialLinks?: Record<string, string>;
}
