import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { VerifyProjectDto } from './dto/verify-project.dto';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    verifyProject: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.PROJECT_OWNER,
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockProject = {
    id: 'project-123',
    isVerified: false,
    verifiedBy: null,
    name: 'Test Project',
    description: 'Test Description',
    status: ProjectStatus.ACTIVE,
    creatorId: 'user-123',
    volunteersNeeded: 5,
    bannerUrl: 'https://example.com/banner.jpg',
    images: ['https://example.com/image1.jpg'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Description',
        volunteersNeeded: 5,
        categoryIds: ['cat-123'],
        skillIds: ['skill-123'],
      };

      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createDto, mockUser as any);

      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('Project created successfully');
      expect(result.data).toEqual(mockProject);
      expect(result.timestamp).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        mockUser.id,
        undefined,
        undefined,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const queryDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [mockProject],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockProjectsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(queryDto as any);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Projects retrieved successfully');
      expect(result.data).toEqual([mockProject]);
      expect(result.meta).toEqual(expectedResult.meta);
      expect(result.timestamp).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne('project-123');

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Project retrieved successfully');
      expect(result.data).toEqual(mockProject);
      expect(result.timestamp).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith('project-123');
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto: UpdateProjectDto = { name: 'Updated Project' };
      const updatedProject = { ...mockProject, name: 'Updated Project' };

      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(
        'project-123',
        updateDto,
        mockUser as any,
      );

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Project updated successfully');
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('Updated Project');
      expect(result.timestamp).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(
        'project-123',
        updateDto,
        mockUser.id,
        mockUser.role,
        undefined,
        undefined,
      );
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('project-123', mockUser as any);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Project deleted successfully');
      expect(result.timestamp).toBeDefined();
      expect(service.remove).toHaveBeenCalledWith(
        'project-123',
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('verifyProject', () => {
    it('should verify a project', async () => {
      const verifyDto: VerifyProjectDto = { isVerified: true };
      const verifiedProject = {
        ...mockProject,
        isVerified: true,
        verifiedBy: 'admin-123',
      };

      mockProjectsService.verifyProject.mockResolvedValue(verifiedProject);

      const result = await controller.verifyProject(
        'project-123',
        verifyDto,
        mockAdminUser as any,
      );

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Project verified successfully');
      expect(result.data).toBeDefined();
      expect(result.data!.isVerified).toBe(true);
      expect(result.data!.verifiedBy).toBe('admin-123');
      expect(result.timestamp).toBeDefined();
      expect(service.verifyProject).toHaveBeenCalledWith(
        'project-123',
        mockAdminUser.id,
        true,
      );
    });

    it('should unverify a project', async () => {
      const verifyDto: VerifyProjectDto = { isVerified: false };
      const unverifiedProject = {
        ...mockProject,
        isVerified: false,
        verifiedBy: null,
      };

      mockProjectsService.verifyProject.mockResolvedValue(unverifiedProject);

      const result = await controller.verifyProject(
        'project-123',
        verifyDto,
        mockAdminUser as any,
      );

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Project unverified successfully');
      expect(result.data).toBeDefined();
      expect(result.data!.isVerified).toBe(false);
      expect(result.data!.verifiedBy).toBe(null);
      expect(result.timestamp).toBeDefined();
      expect(service.verifyProject).toHaveBeenCalledWith(
        'project-123',
        mockAdminUser.id,
        false,
      );
    });
  });
});
