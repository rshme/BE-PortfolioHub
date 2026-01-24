import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
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
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.PROJECT_OWNER,
  };

  const mockProject = {
    id: 'project-123',
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
      expect(result.data.name).toBe('Updated Project');
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
});
