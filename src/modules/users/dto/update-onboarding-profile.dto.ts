import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateOnboardingProfileDto {
  @IsString({ message: 'Bio harus berupa string' })
  @MaxLength(1000, { message: 'Bio maksimal 1000 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @IsString({ message: 'Location harus berupa string' })
  @MaxLength(100, { message: 'Location maksimal 100 karakter' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  location?: string;

  @IsUrl({}, { message: 'GitHub URL harus valid' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  github?: string;

  @IsUrl({}, { message: 'LinkedIn URL harus valid' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  linkedin?: string;

  @IsArray({ message: 'Skills harus berupa array' })
  @IsUUID('4', { each: true, message: 'Setiap skill ID harus berupa UUID valid' })
  @IsOptional()
  @Type(() => String)
  skills?: string[];

  @IsArray({ message: 'Interests harus berupa array' })
  @IsUUID('4', { each: true, message: 'Setiap interest ID harus berupa UUID valid' })
  @IsOptional()
  @Type(() => String)
  interests?: string[];
}
