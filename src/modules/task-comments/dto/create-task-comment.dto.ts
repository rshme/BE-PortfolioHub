import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateTaskCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent comment ID must be a valid UUID' })
  parentCommentId?: string;
}
