import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Category } from './entities/category.entity';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Web Development',
    description: 'Web development projects',
    icon: 'web-icon',
    createdAt: new Date(),
    projects: [],
  };

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Web Development',
      description: 'Web development projects',
      icon: 'web-icon',
    };

    it('should create a new category', async () => {
      mockCategoriesService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(createCategoryDto);

      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Category created successfully',
        data: mockCategory,
        timestamp: expect.any(String),
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const categories = [mockCategory];
      mockCategoriesService.findAll.mockResolvedValue(categories);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Categories retrieved successfully',
        data: categories,
        timestamp: expect.any(String),
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockCategoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(mockCategory.id);

      expect(service.findOne).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Category retrieved successfully',
        data: mockCategory,
        timestamp: expect.any(String),
      });
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateCategoryDto = {
      name: 'Updated Web Development',
      description: 'Updated description',
    };

    it('should update a category', async () => {
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      mockCategoriesService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(
        mockCategory.id,
        updateCategoryDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        mockCategory.id,
        updateCategoryDto,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Category updated successfully',
        data: updatedCategory,
        timestamp: expect.any(String),
      });
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockCategoriesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockCategory.id);

      expect(service.remove).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Category deleted successfully',
        data: null,
        timestamp: expect.any(String),
      });
    });
  });
});
