import { Expose } from 'class-transformer';

export class TestimonialResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  authorName: string;

  @Expose()
  authorPosition?: string;

  @Expose()
  authorCompany?: string;

  @Expose()
  authorAvatarUrl?: string;

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
