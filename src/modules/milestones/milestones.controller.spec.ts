import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import { MilestoneStatus } from '../../common/enums/milestone-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

describe('MilestonesController', () => {
  let controller: MilestonesController;
  let service: MilestonesService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.VOLUNTEER,
  };

  const mockMilestone = {
    id: 'milestone-1',
    projectId: 'project-1',
    name: 'Phase 1',
    description: 'Initial phase',
    status: MilestoneStatus.IN_PROGRESS,
    orderPosition: 0,
    tasks: [],
    taskCount: 5,
    completedTaskCount: 2,
    completionPercentage: 40,
  };

  const mockMilestonesService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestonesController],
      providers: [
        {
          provide: MilestonesService,
          useValue: mockMilestonesService,
        },
      ],
    }).compile();

    controller = module.get<MilestonesController>(MilestonesController);
    service = module.get<MilestonesService>(MilestonesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new milestone', async () => {
      const createDto = {
        name: 'Phase 1',
        description: 'Initial phase',
        status: MilestoneStatus.NOT_STARTED,
        orderPosition: 0,
      };

      mockMilestonesService.create.mockResolvedValue(mockMilestone);

      const result = await controller.create('project-1', createDto, mockUser as any);

      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Milestone created successfully');
      expect(result.data).toEqual(mockMilestone);
      expect(service.create).toHaveBeenCalledWith(
        'project-1',
        createDto,
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('findAllByProject', () => {
    it('should return all milestones for a project', async () => {
      mockMilestonesService.findAllByProject.mockResolvedValue([mockMilestone]);

      const result = await controller.findAllByProject('project-1', mockUser as any);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Milestones retrieved successfully');
      expect(result.data).toEqual([mockMilestone]);
      expect(service.findAllByProject).toHaveBeenCalledWith(
        'project-1',
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single milestone with tasks', async () => {
      mockMilestonesService.findOne.mockResolvedValue(mockMilestone);

      const result = await controller.findOne('milestone-1', mockUser as any);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Milestone retrieved successfully');
      expect(result.data).toEqual(mockMilestone);
      expect(service.findOne).toHaveBeenCalledWith(
        'milestone-1',
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('update', () => {
    it('should update a milestone', async () => {
      const updateDto = {
        name: 'Updated Phase 1',
      };
      const updatedMilestone = { ...mockMilestone, ...updateDto };

      mockMilestonesService.update.mockResolvedValue(updatedMilestone);

      const result = await controller.update('milestone-1', updateDto, mockUser as any);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Milestone updated successfully');
      expect(result.data).toEqual(updatedMilestone);
      expect(service.update).toHaveBeenCalledWith(
        'milestone-1',
        updateDto,
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('remove', () => {
    it('should delete a milestone', async () => {
      mockMilestonesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('milestone-1', mockUser as any);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Milestone deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(
        'milestone-1',
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return milestone statistics', async () => {
      const stats = {
        totalTasks: 5,
        completedTasks: 2,
        inProgressTasks: 2,
        todoTasks: 1,
        completionPercentage: 40,
      };

      mockMilestonesService.getStatistics.mockResolvedValue(stats);

      const result = await controller.getStatistics('milestone-1', mockUser as any);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Milestone statistics retrieved successfully');
      expect(result.data).toEqual(stats);
      expect(service.getStatistics).toHaveBeenCalledWith(
        'milestone-1',
        mockUser.id,
        mockUser.role,
      );
    });
  });
});
