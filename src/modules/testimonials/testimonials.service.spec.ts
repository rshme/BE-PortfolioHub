import { Test, TestingModule } from '@nestjs/testing';
import { TestimonialsService } from './testimonials.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TestimonialsService', () => {
  let service: TestimonialsService;
  let testimonialRepository: Repository<Testimonial>;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    role: 'VOLUNTEER',
  };

  const mockReviewer = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    email: 'reviewer@example.com',
    username: 'reviewer',
    fullName: 'Reviewer User',
    role: 'VOLUNTEER',
  };

  const mockTestimonial = {
    id: '323e4567-e89b-12d3-a456-426614174000',
    userId: mockUser.id,
    reviewerId: mockReviewer.id,
    content: 'Great developer!',
    rating: 5,
    relationship: 'Colleague',
    projectContext: 'E-commerce Project',
    isVisible: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    reviewer: mockReviewer,
  };

  const mockTestimonialRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestimonialsService,
        {
          provide: getRepositoryToken(Testimonial),
          useValue: mockTestimonialRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<TestimonialsService>(TestimonialsService);
    testimonialRepository = module.get<Repository<Testimonial>>(
      getRepositoryToken(Testimonial),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new testimonial', async () => {
      const createDto = {
        userId: mockUser.id,
        reviewerId: mockReviewer.id,
        content: 'Great developer!',
        rating: 5,
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockReviewer);
      mockTestimonialRepository.create.mockReturnValue(mockTestimonial);
      mockTestimonialRepository.save.mockResolvedValue(mockTestimonial);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTestimonial);
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.userId },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.reviewerId },
      });
      expect(mockTestimonialRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockTestimonialRepository.save).toHaveBeenCalledWith(
        mockTestimonial,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const createDto = {
        userId: 'non-existent-id',
        reviewerId: mockReviewer.id,
        content: 'Great developer!',
        rating: 5,
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if reviewer not found', async () => {
      const createDto = {
        userId: mockUser.id,
        reviewerId: 'non-existent-id',
        content: 'Great developer!',
        rating: 5,
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated testimonials', async () => {
      const testimonials = [mockTestimonial];
      mockTestimonialRepository.findAndCount.mockResolvedValue([
        testimonials,
        1,
      ]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: testimonials,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockTestimonialRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by isVisible and isFeatured', async () => {
      const testimonials = [mockTestimonial];
      mockTestimonialRepository.findAndCount.mockResolvedValue([
        testimonials,
        1,
      ]);

      const result = await service.findAll(1, 10, true, false);

      expect(result).toEqual({
        data: testimonials,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockTestimonialRepository.findAndCount).toHaveBeenCalledWith({
        where: { isVisible: true, isFeatured: false },
        relations: ['user', 'reviewer', 'reviewer.organization'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return testimonials for a specific user', async () => {
      const testimonials = [mockTestimonial];
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTestimonialRepository.findAndCount.mockResolvedValue([
        testimonials,
        1,
      ]);

      const result = await service.findByUserId(mockUser.id, 1, 10);

      expect(result).toEqual({
        data: testimonials,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByUserId('non-existent-id', 1, 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a testimonial by id', async () => {
      mockTestimonialRepository.findOne.mockResolvedValue(mockTestimonial);

      const result = await service.findOne(mockTestimonial.id);

      expect(result).toEqual(mockTestimonial);
      expect(mockTestimonialRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTestimonial.id },
        relations: ['user', 'reviewer', 'reviewer.organization'],
      });
    });

    it('should throw NotFoundException if testimonial not found', async () => {
      mockTestimonialRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a testimonial', async () => {
      const updateDto = { content: 'Updated content' };
      const updatedTestimonial = { ...mockTestimonial, ...updateDto };

      mockTestimonialRepository.findOne.mockResolvedValue(mockTestimonial);
      mockTestimonialRepository.save.mockResolvedValue(updatedTestimonial);

      const result = await service.update(mockTestimonial.id, updateDto);

      expect(result).toEqual(updatedTestimonial);
      expect(mockTestimonialRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a testimonial', async () => {
      mockTestimonialRepository.findOne.mockResolvedValue(mockTestimonial);
      mockTestimonialRepository.remove.mockResolvedValue(mockTestimonial);

      await service.remove(mockTestimonial.id);

      expect(mockTestimonialRepository.remove).toHaveBeenCalledWith(
        mockTestimonial,
      );
    });
  });
});
