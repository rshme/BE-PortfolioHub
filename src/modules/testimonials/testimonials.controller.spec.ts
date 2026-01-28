import { Test, TestingModule } from '@nestjs/testing';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { HttpStatus } from '@nestjs/common';

describe('TestimonialsController', () => {
  let controller: TestimonialsController;
  let service: TestimonialsService;

  const mockTestimonial = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    reviewerId: '323e4567-e89b-12d3-a456-426614174000',
    content: 'Great developer!',
    rating: 5,
    relationship: 'Colleague',
    projectContext: 'E-commerce Project',
    isVisible: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestimonialsController],
      providers: [
        {
          provide: TestimonialsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TestimonialsController>(TestimonialsController);
    service = module.get<TestimonialsService>(TestimonialsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new testimonial', async () => {
      const createDto = {
        userId: mockTestimonial.userId,
        reviewerId: mockTestimonial.reviewerId,
        content: 'Great developer!',
        rating: 5,
      };

      mockService.create.mockResolvedValue(mockTestimonial);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Testimonial created successfully',
        data: expect.any(Object),
      });
      expect(mockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated testimonials', async () => {
      const paginatedResult = {
        data: [mockTestimonial],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Testimonials retrieved successfully',
        data: expect.any(Array),
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return testimonials for a specific user', async () => {
      const userId = mockTestimonial.userId;
      const paginatedResult = {
        data: [mockTestimonial],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockService.findByUserId.mockResolvedValue(paginatedResult);

      const result = await controller.findByUserId(userId, 1, 10);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'User testimonials retrieved successfully',
        data: expect.any(Array),
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockService.findByUserId).toHaveBeenCalledWith(
        userId,
        1,
        10,
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should return a testimonial by id', async () => {
      mockService.findOne.mockResolvedValue(mockTestimonial);

      const result = await controller.findOne(mockTestimonial.id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Testimonial retrieved successfully',
        data: expect.any(Object),
      });
      expect(mockService.findOne).toHaveBeenCalledWith(mockTestimonial.id);
    });
  });

  describe('update', () => {
    it('should update a testimonial', async () => {
      const updateDto = { content: 'Updated content' };
      const updatedTestimonial = { ...mockTestimonial, ...updateDto };

      mockService.update.mockResolvedValue(updatedTestimonial);

      const result = await controller.update(mockTestimonial.id, updateDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Testimonial updated successfully',
        data: expect.any(Object),
      });
      expect(mockService.update).toHaveBeenCalledWith(
        mockTestimonial.id,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a testimonial', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockTestimonial.id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Testimonial deleted successfully',
        data: null,
      });
      expect(mockService.remove).toHaveBeenCalledWith(mockTestimonial.id);
    });
  });
});
