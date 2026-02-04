import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SurveyType {
  PRE_TEST = 'pre_test',
  POST_TEST = 'post_test',
  SATISFACTION = 'satisfaction',
  FEEDBACK = 'feedback',
}

export class SkillAssessmentDto {
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @IsString()
  @IsNotEmpty()
  skillName: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  preTestScore?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  postTestScore?: number;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  selfReportedLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export class SubmitSurveyDto {
  @IsEnum(SurveyType)
  @IsNotEmpty()
  surveyType: SurveyType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillAssessmentDto)
  @IsOptional()
  skillAssessments?: SkillAssessmentDto[];

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  overallSatisfaction?: number;

  @IsOptional()
  responses?: Record<string, any>;

  @IsOptional()
  metadata?: Record<string, any>;
}
