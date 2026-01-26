import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MilestonesService } from './milestones.service';
import { Milestone } from './entities/milestone.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import { MilestoneStatus } from '../../common/enums/milestone-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('MilestonesService', () => {
  let service: MilestonesService;
  let milestoneRepository: Repository<Milestone>;
  let taskRepository: Repository<Task>;
  let projectRepository: Repository<Project>;
  let projectMentorRepository: Repository<ProjectMentor>;
  let projectVolunteerRepository: Repository<ProjectVolunteer>;

  const mockMilestone = {
    id: 'milestone-1',
    projectId: 'project-1',
    name: 'Phase 1',
    description: 'Initial phase',
    status: MilestoneStatus.IN_PROGRESS,
    orderPosition: 0,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    tags: ['backend', 'setup'],
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
  };

  const mockProject = {
    id: 'project-1',
    creatorId: 'user-1',
    name: 'Test Project',
  };

  const mockTask = {
    id: 'task-1',
    milestoneId: 'milestone-1',
    status: TaskStatus.COMPLETED,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        {
          provide: getRepositoryToken(Milestone),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProjectMentor),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProjectVolunteer),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    milestoneRepository = module.get<Repository<Milestone>>(
      getRepositoryToken(Milestone),
    );
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    projectRepository = module.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    projectMentorRepository = module.get<Repository<ProjectMentor>>(
      getRepositoryToken(ProjectMentor),
    );
    projectVolunteerRepository = module.get<Repository<ProjectVolunteer>>(
      getRepositoryToken(ProjectVolunteer),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Phase 1',
      description: 'Initial phase',
      status: MilestoneStatus.NOT_STARTED,
      orderPosition: 0,
    };

    it('should create a milestone successfully', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(milestoneRepository, 'create').mockReturnValue(mockMilestone as any);
      jest.spyOn(milestoneRepository, 'save').mockResolvedValue(mockMilestone as any);

      const result = await service.create('project-1', createDto, 'user-1', UserRole.VOLUNTEER);

      expect(result).toBeDefined();
      expect(result.taskCount).toBe(0);
      expect(result.completedTaskCount).toBe(0);
      expect(result.completionPercentage).toBe(0);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create('invalid-project', createDto, 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when end date is before start date', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);

      const invalidDto = {
        ...createDto,
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      await expect(
        service.create('project-1', invalidDto, 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByProject', () => {
    it('should return milestones with statistics for a project', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(milestoneRepository, 'find').mockResolvedValue([mockMilestone] as any);
      jest.spyOn(taskRepository, 'find').mockResolvedValue([mockTask] as any);

      const result = await service.findAllByProject('project-1', 'user-1', UserRole.VOLUNTEER);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('taskCount');
      expect(result[0]).toHaveProperty('completionPercentage');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findAllByProject('invalid-project', 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return milestone with tasks and statistics', async () => {
      const milestoneWithProject = { ...mockMilestone, project: mockProject };
      jest
        .spyOn(milestoneRepository, 'findOne')
        .mockResolvedValue(milestoneWithProject as any);
      jest.spyOn(taskRepository, 'find').mockResolvedValue([mockTask] as any);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);

      const result = await service.findOne('milestone-1', 'user-1', UserRole.VOLUNTEER);

      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(result.taskCount).toBeGreaterThanOrEqual(0);
      expect(result.completionPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundException when milestone does not exist', async () => {
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findOne('invalid-id', 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Phase 1',
      description: 'Updated description',
    };

    it('should update a milestone successfully', async () => {
      const updatedMilestone = { ...mockMilestone, ...updateDto };
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(mockMilestone as any);
      jest.spyOn(milestoneRepository, 'save').mockResolvedValue(updatedMilestone as any);
      jest.spyOn(taskRepository, 'find').mockResolvedValue([]);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);

      const result = await service.update('milestone-1', updateDto, 'user-1', UserRole.VOLUNTEER);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException when milestone does not exist', async () => {
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateDto, 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a milestone successfully when no tasks exist', async () => {
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(mockMilestone as any);
      jest.spyOn(taskRepository, 'count').mockResolvedValue(0);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(milestoneRepository, 'remove').mockResolvedValue(mockMilestone as any);

      await service.remove('milestone-1', 'user-1', UserRole.VOLUNTEER);

      expect(milestoneRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when milestone has tasks', async () => {
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(mockMilestone as any);
      jest.spyOn(taskRepository, 'count').mockResolvedValue(5);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);

      await expect(
        service.remove('milestone-1', 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when milestone does not exist', async () => {
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.remove('invalid-id', 'user-1', UserRole.VOLUNTEER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return milestone statistics', async () => {
      jest.spyOn(milestoneRepository, 'findOne').mockResolvedValue(mockMilestone as any);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(taskRepository, 'find').mockResolvedValue([
        { status: TaskStatus.TODO },
        { status: TaskStatus.IN_PROGRESS },
        { status: TaskStatus.COMPLETED },
      ] as any);

      const result = await service.getStatistics('milestone-1', 'user-1', UserRole.VOLUNTEER);

      expect(result).toBeDefined();
      expect(result.totalTasks).toBe(3);
      expect(result.completedTasks).toBe(1);
      expect(result.todoTasks).toBe(1);
      expect(result.inProgressTasks).toBe(1);
    });
  });
});
