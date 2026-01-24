import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../../../common/enums/project-status.enum';

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
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
