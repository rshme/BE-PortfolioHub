import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Web Development',
    description: 'Web development projects',
    icon: 'web-icon',
    createdAt: new Date(),
    projects: [],
  };

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Web Development',
      description: 'Web development projects',
      icon: 'web-icon',
    };

    it('should create a new category', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        createCategoryDto,
      );
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException if category name already exists', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(createCategoryDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createCategoryDto)).rejects.toThrow(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const categories = [mockCategory];
      mockCategoryRepository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
    });

    it('should return an empty array if no categories exist', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      const id = 'non-existent-id';
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(
        `Category with ID "${id}" not found`,
      );
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateCategoryDto = {
      name: 'Updated Web Development',
      description: 'Updated description',
    };

    beforeEach(() => {
      // Clear any leftover mocks before each test in this describe block
      mockCategoryRepository.findOne.mockClear();
      mockCategoryRepository.save.mockClear();
    });

    it('should update a category', async () => {
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      mockCategoryRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update(mockCategory.id, updateCategoryDto);

      expect(mockCategoryRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateCategoryDto.name);
      expect(result.description).toBe(updateCategoryDto.description);
    });

    it('should throw NotFoundException if category not found', async () => {
      const id = 'non-existent-id';
      mockCategoryRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.update(id, updateCategoryDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name already exists', async () => {
      const existingCategory = {
        ...mockCategory,
        id: 'different-id',
        name: 'Updated Web Development',
      };
      // First call for findOne to get the category to update
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(mockCategory)
        // Second call to check if name already exists
        .mockResolvedValueOnce(existingCategory);

      await expect(
        service.update(mockCategory.id, updateCategoryDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      // Clear any leftover mocks before each test in this describe block
      mockCategoryRepository.findOne.mockClear();
      mockCategoryRepository.remove.mockClear();
    });

    it('should remove a category', async () => {
      mockCategoryRepository.findOne.mockResolvedValueOnce(mockCategory);
      mockCategoryRepository.remove.mockResolvedValueOnce(mockCategory);

      await service.remove(mockCategory.id);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(mockCategoryRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      const id = 'non-existent-id';
      mockCategoryRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});
