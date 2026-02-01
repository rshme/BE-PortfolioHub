import { CreateProjectDto } from './create-project.dto';
import { IsOptional, IsBoolean, IsArray, IsString, IsEnum } from 'class-validator';
import { ProjectLevel } from '../../../common/enums/project-level.enum';

export class UpdateProjectDto implements Partial<CreateProjectDto> {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  status?: any;

  @IsEnum(ProjectLevel)
  @IsOptional()
  level?: ProjectLevel;

  @IsOptional()
  volunteersNeeded?: number;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  links?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  skills?: Array<{ skillId: string; isMandatory: boolean }>;

  @IsBoolean()
  @IsOptional()
  removeBanner?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeImages?: string[];
}
