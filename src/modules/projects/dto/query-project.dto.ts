import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../../../common/enums/project-status.enum';
import { ProjectLevel } from '../../../common/enums/project-level.enum';

export class QueryProjectDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectLevel)
  level?: ProjectLevel;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  skillId?: string;

  @IsOptional()
  @IsUUID('4')
  creatorId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['true', 'false', '1', '0'], {
    message: 'isVerified must be one of: true, false, 1, or 0',
  })
  isVerified?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
