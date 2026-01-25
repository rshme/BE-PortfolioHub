import { IsOptional, IsEnum } from 'class-validator';
import { MentorStatus } from '../../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../../common/enums/volunteer-status.enum';

export class QueryMentorDto {
  @IsOptional()
  @IsEnum(MentorStatus)
  status?: MentorStatus;
}

export class QueryVolunteerDto {
  @IsOptional()
  @IsEnum(VolunteerStatus)
  status?: VolunteerStatus;
}
