import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';

export class ApplyMentorDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  applicationMessage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertiseAreas?: string[];
}

export class InviteMentorDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertiseAreas?: string[];
}

export class UpdateMentorStatusDto {
  @IsNotEmpty()
  @IsString()
  mentorId: string;
}
