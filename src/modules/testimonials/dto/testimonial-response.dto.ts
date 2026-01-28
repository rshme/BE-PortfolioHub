import { Expose, Type, Exclude } from 'class-transformer';

@Exclude()
class ReviewerOrganizationDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  industry?: string;

  @Expose()
  website?: string;

  @Expose()
  logo?: string;
}

@Exclude()
class ReviewerDto {
  @Expose()
  fullName: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  role: string;

  @Expose()
  @Type(() => ReviewerOrganizationDto)
  organization?: ReviewerOrganizationDto | null;
}

@Exclude()
export class TestimonialResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  reviewerId: string;

  @Expose()
  @Type(() => ReviewerDto)
  reviewer?: ReviewerDto;

  @Expose()
  content: string;

  @Expose()
  rating: number;

  @Expose()
  relationship?: string;

  @Expose()
  projectContext?: string;

  @Expose()
  isVisible: boolean;

  @Expose()
  isFeatured: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
