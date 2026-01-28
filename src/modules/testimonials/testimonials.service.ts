import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialsRepository: Repository<Testimonial>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Create a new testimonial
   */
  async create(
    createTestimonialDto: CreateTestimonialDto,
  ): Promise<Testimonial> {
    // Verify user exists
    const user = await this.usersRepository.findOne({
      where: { id: createTestimonialDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify reviewer exists
    const reviewer = await this.usersRepository.findOne({
      where: { id: createTestimonialDto.reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    const testimonial = this.testimonialsRepository.create(
      createTestimonialDto,
    );
    return await this.testimonialsRepository.save(testimonial);
  }

  /**
   * Find all testimonials with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    isVisible?: boolean,
    isFeatured?: boolean,
  ): Promise<{
    data: Testimonial[];
    total: number;
    page: number;
    limit: number;
  }> {
    const whereCondition: any = {};

    if (isVisible !== undefined) {
      whereCondition.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      whereCondition.isFeatured = isFeatured;
    }

    const [data, total] = await this.testimonialsRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'reviewer', 'reviewer.organization'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find testimonials by user ID
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    isVisible?: boolean,
  ): Promise<{
    data: Testimonial[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Verify user exists
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const whereCondition: any = { userId };

    if (isVisible !== undefined) {
      whereCondition.isVisible = isVisible;
    }

    const [data, total] = await this.testimonialsRepository.findAndCount({
      where: whereCondition,
      relations: ['reviewer', 'reviewer.organization'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find testimonial by ID
   */
  async findOne(id: string): Promise<Testimonial> {
    const testimonial = await this.testimonialsRepository.findOne({
      where: { id },
      relations: ['user', 'reviewer', 'reviewer.organization'],
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return testimonial;
  }

  /**
   * Update testimonial
   */
  async update(
    id: string,
    updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<Testimonial> {
    const testimonial = await this.findOne(id);

    Object.assign(testimonial, updateTestimonialDto);
    return await this.testimonialsRepository.save(testimonial);
  }

  /**
   * Delete testimonial
   */
  async remove(id: string): Promise<void> {
    const testimonial = await this.findOne(id);
    await this.testimonialsRepository.remove(testimonial);
  }
}
