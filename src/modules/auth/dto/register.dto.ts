import { IsEmail, IsString, MinLength, Matches, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @IsEmail({}, { message: 'Email harus valid' })
  email: string;

  @IsString({ message: 'Username harus berupa string' })
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
  })
  username: string;

  @IsString({ message: 'Password harus berupa string' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsString({ message: 'Nama lengkap harus berupa string' })
  @MinLength(3, { message: 'Nama lengkap minimal 3 karakter' })
  fullName: string;

  @IsEnum(UserRole, { message: 'Role harus salah satu dari: admin, mentor, volunteer, project_owner' })
  role: UserRole;
}
