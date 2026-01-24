import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';

@Exclude()
export class PublicUserResponseDto {
  @Expose()
  id: string;

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
  createdAt: Date;
}
