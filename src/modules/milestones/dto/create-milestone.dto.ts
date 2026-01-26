import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MilestoneStatus } from '../../../common/enums/milestone-status.enum';

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus = MilestoneStatus.NOT_STARTED;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  orderPosition?: number = 0;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
