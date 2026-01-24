import { IsOptional, IsBoolean } from 'class-validator';

export class VerifyProjectDto {
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean = true;
}
