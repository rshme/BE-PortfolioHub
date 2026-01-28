import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: Repository<Organization>;

  const mockOrganization = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Organization',
    description: 'Test Description',
    industry: 'Technology',
    websiteUrl: 'https://test.com',
    logoUrl: 'https://test.com/logo.png',
    location: 'Jakarta',
    employeeCount: 50,
    foundedYear: 2020,
    socialLinks: { linkedin: 'https://linkedin.com/test' },
    mission: 'Test Mission',
    vision: 'Test Vision',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [],
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const createDto = {
        name: 'Test Organization',
        description: 'Test Description',
        industry: 'Technology',
        websiteUrl: 'https://test.com',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockOrganization);
      mockRepository.save.mockResolvedValue(mockOrganization);

      const result = await service.create(createDto);

      expect(result).toEqual(mockOrganization);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockOrganization);
    });

    it('should throw ConflictException if organization name exists', async () => {
      const createDto = {
        name: 'Test Organization',
        description: 'Test Description',
      };

      mockRepository.findOne.mockResolvedValue(mockOrganization);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated organizations', async () => {
      const organizations = [mockOrganization];
      mockRepository.findAndCount.mockResolvedValue([organizations, 1]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: organizations,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by isActive', async () => {
      const organizations = [mockOrganization];
      mockRepository.findAndCount.mockResolvedValue([organizations, 1]);

      const result = await service.findAll(1, 10, true);

      expect(result).toEqual({
        data: organizations,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an organization by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganization);

      const result = await service.findOne(mockOrganization.id);

      expect(result).toEqual(mockOrganization);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
      });
    });

    it('should throw NotFoundException if organization not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const updateDto = { description: 'Updated Description' };
      const updatedOrganization = { ...mockOrganization, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockOrganization);
      mockRepository.save.mockResolvedValue(updatedOrganization);

      const result = await service.update(mockOrganization.id, updateDto);

      expect(result).toEqual(updatedOrganization);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto = { name: 'Existing Name' };
      const existingOrg = { ...mockOrganization, id: 'different-id' };

      mockRepository.findOne
        .mockResolvedValueOnce(mockOrganization)
        .mockResolvedValueOnce(existingOrg);

      await expect(
        service.update(mockOrganization.id, updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete an organization', async () => {
      const softDeletedOrg = { ...mockOrganization, isActive: false };

      mockRepository.findOne.mockResolvedValue(mockOrganization);
      mockRepository.save.mockResolvedValue(softDeletedOrg);

      await service.remove(mockOrganization.id);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockOrganization,
        isActive: false,
      });
    });
  });

  describe('hardRemove', () => {
    it('should hard delete an organization', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganization);
      mockRepository.remove.mockResolvedValue(mockOrganization);

      await service.hardRemove(mockOrganization.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockOrganization);
    });
  });
});
