import { CreateProjectDto } from './create-project.dto';
import { IsOptional, IsBoolean, IsArray, IsString } from 'class-validator';

export class UpdateProjectDto implements Partial<CreateProjectDto> {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  status?: any;

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
  @IsString({ each: true })
  skillIds?: string[];

  @IsBoolean()
  @IsOptional()
  removeBanner?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeImages?: string[];
}
