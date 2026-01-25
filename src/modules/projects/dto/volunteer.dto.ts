import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class ApplyVolunteerDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  applicationMessage?: string;
}

export class InviteVolunteerDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class UpdateVolunteerStatusDto {
  @IsNotEmpty()
  @IsString()
  volunteerId: string;
}
