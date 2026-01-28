import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
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

  @IsUUID('4', { message: 'Reviewer ID harus berupa UUID yang valid' })
  reviewerId: string;

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
