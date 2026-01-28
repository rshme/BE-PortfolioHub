import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTestimonialDto {
  @IsUUID('4', { message: 'User ID harus berupa UUID yang valid' })
  userId: string;

  @IsString({ message: 'Nama author harus berupa string' })
  @MinLength(2, { message: 'Nama author minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama author maksimal 100 karakter' })
  @Transform(({ value }) => value?.trim())
  authorName: string;

  @IsString()
  @MaxLength(150, { message: 'Posisi author maksimal 150 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  authorPosition?: string;

  @IsString()
  @MaxLength(150, { message: 'Perusahaan author maksimal 150 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  authorCompany?: string;

  @IsUrl({}, { message: 'Avatar URL harus valid' })
  @IsOptional()
  authorAvatarUrl?: string;

  @IsString({ message: 'Konten testimonial harus berupa string' })
  @MinLength(10, { message: 'Konten testimonial minimal 10 karakter' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @IsInt({ message: 'Rating harus berupa angka' })
  @Min(1, { message: 'Rating minimal 1' })
  @Max(5, { message: 'Rating maksimal 5' })
  @IsOptional()
  rating?: number;

  @IsString()
  @MaxLength(100, { message: 'Hubungan maksimal 100 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  relationship?: string;

  @IsString()
  @MaxLength(255, { message: 'Konteks project maksimal 255 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  projectContext?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
