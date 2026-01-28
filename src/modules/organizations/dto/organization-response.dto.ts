import { Expose } from 'class-transformer';

export class OrganizationResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  industry?: string;

  @Expose()
  websiteUrl?: string;

  @Expose()
  logoUrl?: string;

  @Expose()
  location?: string;

  @Expose()
  employeeCount?: number;

  @Expose()
  foundedYear?: number;

  @Expose()
  socialLinks?: Record<string, string>;

  @Expose()
  mission?: string;

  @Expose()
  vision?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
