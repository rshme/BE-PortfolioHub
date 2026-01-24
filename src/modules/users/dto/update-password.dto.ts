import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: 'Password lama harus berupa string' })
  oldPassword: string;

  @IsString({ message: 'Password baru harus berupa string' })
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  newPassword: string;
}
