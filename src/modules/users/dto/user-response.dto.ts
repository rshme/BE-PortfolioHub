import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  fullName: string;

  @Expose()
  role: UserRole;

  @Expose()
  avatarUrl?: string;

  @Expose()
  bio?: string;

  @Expose()
  socialLinks?: Record<string, string>;

  @Expose()
  organizationId?: string;

  @Expose()
  organization?: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
