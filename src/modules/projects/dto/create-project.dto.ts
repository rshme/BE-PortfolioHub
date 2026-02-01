import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
  IsObject,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../../../common/enums/project-status.enum';
import { ProjectLevel } from '../../../common/enums/project-level.enum';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus = ProjectStatus.DRAFT;

  @IsEnum(ProjectLevel)
  @IsOptional()
  level?: ProjectLevel = ProjectLevel.BEGINNER;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  volunteersNeeded?: number = 0;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsObject()
  @IsOptional()
  links?: Record<string, string>;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  categoryIds: string[];

  @IsArray()
  @IsNotEmpty()
  skills: Array<{ skillId: string; isMandatory: boolean }>;
}
