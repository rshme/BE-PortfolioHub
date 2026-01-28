import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { HttpStatus } from '@nestjs/common';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: OrganizationsService;

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
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    hardRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const createDto = {
        name: 'Test Organization',
        description: 'Test Description',
      };

      mockService.create.mockResolvedValue(mockOrganization);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Organization created successfully',
        data: expect.any(Object),
      });
      expect(mockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated organizations', async () => {
      const paginatedResult = {
        data: [mockOrganization],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Organizations retrieved successfully',
        data: expect.any(Array),
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockService.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('findOne', () => {
    it('should return an organization by id', async () => {
      mockService.findOne.mockResolvedValue(mockOrganization);

      const result = await controller.findOne(mockOrganization.id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Organization retrieved successfully',
        data: expect.any(Object),
      });
      expect(mockService.findOne).toHaveBeenCalledWith(mockOrganization.id);
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const updateDto = { description: 'Updated Description' };
      const updatedOrg = { ...mockOrganization, ...updateDto };

      mockService.update.mockResolvedValue(updatedOrg);

      const result = await controller.update(mockOrganization.id, updateDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Organization updated successfully',
        data: expect.any(Object),
      });
      expect(mockService.update).toHaveBeenCalledWith(
        mockOrganization.id,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an organization', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockOrganization.id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Organization deleted successfully',
        data: null,
      });
      expect(mockService.remove).toHaveBeenCalledWith(mockOrganization.id);
    });
  });

  describe('hardRemove', () => {
    it('should hard delete an organization', async () => {
      mockService.hardRemove.mockResolvedValue(undefined);

      const result = await controller.hardRemove(mockOrganization.id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Organization permanently deleted',
        data: null,
      });
      expect(mockService.hardRemove).toHaveBeenCalledWith(mockOrganization.id);
    });
  });
});
