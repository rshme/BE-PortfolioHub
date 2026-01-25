import { IsUUID, IsOptional } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  @IsOptional()
  assignedToId?: string | null;
}
