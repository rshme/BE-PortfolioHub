import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateTaskCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content: string;
}
