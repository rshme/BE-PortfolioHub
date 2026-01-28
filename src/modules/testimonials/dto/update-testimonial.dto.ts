import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTestimonialDto } from './create-testimonial.dto';

export class UpdateTestimonialDto extends PartialType(
  OmitType(CreateTestimonialDto, ['userId'] as const),
) {}
