import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrganizationDto {
  @IsString({ message: 'Nama organisasi harus berupa string' })
  @MinLength(3, { message: 'Nama organisasi minimal 3 karakter' })
  @MaxLength(255, { message: 'Nama organisasi maksimal 255 karakter' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString({ message: 'Deskripsi harus berupa string' })
  @MinLength(10, { message: 'Deskripsi minimal 10 karakter' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsString()
  @MaxLength(100, { message: 'Industri maksimal 100 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  industry?: string;

  @IsUrl({}, { message: 'Website URL harus valid' })
  @IsOptional()
  websiteUrl?: string;

  @IsUrl({}, { message: 'Logo URL harus valid' })
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @MaxLength(255, { message: 'Lokasi maksimal 255 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  location?: string;

  @IsInt({ message: 'Jumlah karyawan harus berupa angka' })
  @Min(1, { message: 'Jumlah karyawan minimal 1' })
  @IsOptional()
  employeeCount?: number;

  @IsInt({ message: 'Tahun didirikan harus berupa angka' })
  @Min(1800, { message: 'Tahun didirikan minimal 1800' })
  @Max(new Date().getFullYear(), {
    message: 'Tahun didirikan tidak boleh melebihi tahun saat ini',
  })
  @IsOptional()
  foundedYear?: number;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  mission?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  vision?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
