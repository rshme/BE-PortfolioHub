import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
  TestimonialResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '../../common/interfaces/api-response.interface';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  /**
   * Create a new testimonial
   * POST /testimonials
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createTestimonialDto: CreateTestimonialDto,
  ): Promise<ApiResponse<TestimonialResponseDto>> {
    const testimonial = await this.testimonialsService.create(
      createTestimonialDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Testimonial created successfully',
      data: plainToInstance(TestimonialResponseDto, testimonial, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get all testimonials with pagination
   * GET /testimonials?page=1&limit=10&isVisible=true&isFeatured=false
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isVisible') isVisible?: string,
    @Query('isFeatured') isFeatured?: string,
  ): Promise<ApiResponse<TestimonialResponseDto[]>> {
    const isVisibleBoolean =
      isVisible !== undefined ? isVisible === 'true' : undefined;
    const isFeaturedBoolean =
      isFeatured !== undefined ? isFeatured === 'true' : undefined;

    const result = await this.testimonialsService.findAll(
      page,
      limit,
      isVisibleBoolean,
      isFeaturedBoolean,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Testimonials retrieved successfully',
      data: plainToInstance(TestimonialResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get testimonials by user ID
   * GET /testimonials/user/:userId?page=1&limit=10&isVisible=true
   */
  @Get('user/:userId')
  async findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isVisible') isVisible?: string,
  ): Promise<ApiResponse<TestimonialResponseDto[]>> {
    const isVisibleBoolean =
      isVisible !== undefined ? isVisible === 'true' : undefined;

    const result = await this.testimonialsService.findByUserId(
      userId,
      page,
      limit,
      isVisibleBoolean,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User testimonials retrieved successfully',
      data: plainToInstance(TestimonialResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get testimonial by ID
   * GET /testimonials/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<TestimonialResponseDto>> {
    const testimonial = await this.testimonialsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Testimonial retrieved successfully',
      data: plainToInstance(TestimonialResponseDto, testimonial, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Update testimonial
   * PUT /testimonials/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<ApiResponse<TestimonialResponseDto>> {
    const testimonial = await this.testimonialsService.update(
      id,
      updateTestimonialDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Testimonial updated successfully',
      data: plainToInstance(TestimonialResponseDto, testimonial, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Delete testimonial
   * DELETE /testimonials/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.testimonialsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Testimonial deleted successfully',
      data: null,
    };
  }
}
