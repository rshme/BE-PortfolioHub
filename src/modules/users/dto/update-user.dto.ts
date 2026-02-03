import {
  IsOptional,
  IsString,
  IsUrl,
  IsObject,
  IsUUID,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsString({ message: 'Nama lengkap harus berupa string' })
  @MinLength(3, { message: 'Nama lengkap minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @IsUrl({}, { message: 'Avatar URL harus valid' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  avatarUrl?: string;

  @IsString({ message: 'Bio harus berupa string' })
  @MaxLength(1000, { message: 'Bio maksimal 1000 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @IsObject({ message: 'Social links harus berupa object' })
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsUUID('4', { message: 'Organization ID harus berupa UUID valid' })
  @IsOptional()
  organizationId?: string;

  @IsArray({ message: 'Skills harus berupa array' })
  @IsUUID('4', { each: true, message: 'Setiap skill ID harus berupa UUID valid' })
  @IsOptional()
  skills?: string[];

  @IsArray({ message: 'Interests harus berupa array' })
  @IsUUID('4', { each: true, message: 'Setiap interest ID harus berupa UUID valid' })
  @IsOptional()
  interests?: string[];
}
