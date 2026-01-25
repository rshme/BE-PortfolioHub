import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsUrl,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Email harus valid' })
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsString({ message: 'Username harus berupa string' })
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @MaxLength(30, { message: 'Username maksimal 30 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
  })
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  username?: string;

  @IsString({ message: 'Nama lengkap harus berupa string' })
  @MinLength(3, { message: 'Nama lengkap minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @IsEnum(UserRole, { message: 'Role tidak valid' })
  @IsOptional()
  role?: UserRole;

  @IsUrl({}, { message: 'Avatar URL harus valid' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  avatarUrl?: string;

  @IsString({ message: 'Bio harus berupa string' })
  @MaxLength(500, { message: 'Bio maksimal 500 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @IsObject({ message: 'Social links harus berupa object' })
  @IsOptional()
  socialLinks?: Record<string, string>;
}
