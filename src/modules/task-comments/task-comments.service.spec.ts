import { Test, TestingModule } from '@nestjs/testing';
import { TaskCommentsService } from './task-comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from './entities/task-comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';

describe('TaskCommentsService', () => {
  let service: TaskCommentsService;
  let taskCommentRepository: Repository<TaskComment>;
  let taskRepository: Repository<Task>;
  let projectRepository: Repository<Project>;
  let projectMentorRepository: Repository<ProjectMentor>;
  let projectVolunteerRepository: Repository<ProjectVolunteer>;

  const mockUserId = 'user-123';
  const mockTaskId = 'task-123';
  const mockProjectId = 'project-123';
  const mockCommentId = 'comment-123';

  const mockUser = {
    id: mockUserId,
    username: 'testuser',
    fullName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockTask = {
    id: mockTaskId,
    projectId: mockProjectId,
    title: 'Test Task',
    project: { id: mockProjectId, creatorId: mockUserId },
  };

  const mockComment = {
    id: mockCommentId,
    taskId: mockTaskId,
    userId: mockUserId,
    content: 'Test comment',
    isEdited: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    task: mockTask,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskCommentsService,
        {
          provide: getRepositoryToken(TaskComment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<TaskCommentsService>(TaskCommentsService);
    taskCommentRepository = module.get<Repository<TaskComment>>(
      getRepositoryToken(TaskComment),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment successfully as project creator', async () => {
      const createDto = { content: 'New comment' };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);
      jest.spyOn(taskCommentRepository, 'create').mockReturnValue({
        ...mockComment,
        content: createDto.content,
      } as any);
      jest
        .spyOn(taskCommentRepository, 'save')
        .mockResolvedValue({ id: mockCommentId } as any);
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue({ ...mockComment, content: createDto.content } as any);

      const result = await service.create(mockTaskId, createDto, mockUserId);

      expect(result.content).toBe(createDto.content);
      expect(taskCommentRepository.create).toHaveBeenCalledWith({
        ...createDto,
        taskId: mockTaskId,
        userId: mockUserId,
      });
    });

    it('should create a reply successfully', async () => {
      const parentCommentId = 'parent-123';
      const createDto = {
        content: 'Reply comment',
        parentCommentId,
      };
      const parentComment = {
        id: parentCommentId,
        taskId: mockTaskId,
        parentCommentId: null,
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValueOnce(parentComment as any)
        .mockResolvedValueOnce({ ...mockComment, content: createDto.content } as any);
      jest.spyOn(taskCommentRepository, 'create').mockReturnValue({
        ...mockComment,
        content: createDto.content,
      } as any);
      jest
        .spyOn(taskCommentRepository, 'save')
        .mockResolvedValue({ id: mockCommentId } as any);

      const result = await service.create(mockTaskId, createDto, mockUserId);

      expect(result.content).toBe(createDto.content);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const createDto = { content: 'New comment' };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(mockTaskId, createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      const createDto = { content: 'New comment' };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectMentorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectVolunteerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(mockTaskId, createDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when parent comment does not exist', async () => {
      const createDto = {
        content: 'Reply comment',
        parentCommentId: 'non-existent',
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);
      jest.spyOn(taskCommentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(mockTaskId, createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when parent comment belongs to different task', async () => {
      const createDto = {
        content: 'Reply comment',
        parentCommentId: 'parent-123',
      };
      const parentComment = {
        id: 'parent-123',
        taskId: 'other-task',
        parentCommentId: null,
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(parentComment as any);

      await expect(
        service.create(mockTaskId, createDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to reply to a reply', async () => {
      const createDto = {
        content: 'Reply to reply',
        parentCommentId: 'parent-123',
      };
      const parentComment = {
        id: 'parent-123',
        taskId: mockTaskId,
        parentCommentId: 'grandparent-123',
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(parentComment as any);

      await expect(
        service.create(mockTaskId, createDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByTask', () => {
    it('should return threaded comments for a task', async () => {
      const parentComment = {
        id: 'parent-1',
        taskId: mockTaskId,
        userId: mockUserId,
        content: 'Parent comment',
        parentCommentId: null,
        user: mockUser,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const replyComment = {
        id: 'reply-1',
        taskId: mockTaskId,
        userId: mockUserId,
        content: 'Reply comment',
        parentCommentId: 'parent-1',
        user: mockUser,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);
      jest
        .spyOn(taskCommentRepository, 'find')
        .mockResolvedValue([parentComment, replyComment] as any);

      const result = await service.findAllByTask(mockTaskId, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('parent-1');
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].id).toBe('reply-1');
    });

    it('should throw NotFoundException when task does not exist', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findAllByTask(mockTaskId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectMentorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectVolunteerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findAllByTask(mockTaskId, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a single comment', async () => {
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(mockComment as any);
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);

      const result = await service.findOne(mockCommentId, mockUserId);

      expect(result.id).toBe(mockCommentId);
      expect(result.content).toBe(mockComment.content);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      jest.spyOn(taskCommentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(mockCommentId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(mockComment as any);
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectMentorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectVolunteerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findOne(mockCommentId, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a comment successfully', async () => {
      const updateDto = { content: 'Updated content' };
      const updatedComment = {
        ...mockComment,
        content: updateDto.content,
        isEdited: true,
      };

      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValueOnce(mockComment as any)
        .mockResolvedValueOnce(updatedComment as any);
      jest
        .spyOn(taskCommentRepository, 'save')
        .mockResolvedValue(updatedComment as any);

      const result = await service.update(mockCommentId, updateDto, mockUserId);

      expect(result.content).toBe(updateDto.content);
      expect(result.isEdited).toBe(true);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      const updateDto = { content: 'Updated content' };

      jest.spyOn(taskCommentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(mockCommentId, updateDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the comment author', async () => {
      const updateDto = { content: 'Updated content' };

      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(mockComment as any);

      await expect(
        service.update(mockCommentId, updateDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a comment successfully', async () => {
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(mockComment as any);
      jest.spyOn(taskCommentRepository, 'remove').mockResolvedValue({} as any);

      await expect(
        service.remove(mockCommentId, mockUserId),
      ).resolves.toBeUndefined();
      expect(taskCommentRepository.remove).toHaveBeenCalledWith(mockComment);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      jest.spyOn(taskCommentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(mockCommentId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the comment author', async () => {
      jest
        .spyOn(taskCommentRepository, 'findOne')
        .mockResolvedValue(mockComment as any);

      await expect(
        service.remove(mockCommentId, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCommentCount', () => {
    it('should return the comment count for a task', async () => {
      const count = 5;

      jest.spyOn(taskCommentRepository, 'count').mockResolvedValue(count);

      const result = await service.getCommentCount(mockTaskId);

      expect(result).toBe(count);
      expect(taskCommentRepository.count).toHaveBeenCalledWith({
        where: { taskId: mockTaskId },
      });
    });
  });

  describe('hasProjectAccess', () => {
    it('should return true for project creator', async () => {
      jest
        .spyOn(projectRepository, 'findOne')
        .mockResolvedValue({ id: mockProjectId, creatorId: mockUserId } as any);

      // Access private method for testing
      const result = await (service as any).hasProjectAccess(
        mockProjectId,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should return true for active mentor', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectMentorRepository, 'findOne').mockResolvedValue({
        projectId: mockProjectId,
        userId: mockUserId,
        status: MentorStatus.ACTIVE,
      } as any);

      const result = await (service as any).hasProjectAccess(
        mockProjectId,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should return true for active volunteer', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectMentorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectVolunteerRepository, 'findOne').mockResolvedValue({
        projectId: mockProjectId,
        userId: mockUserId,
        status: VolunteerStatus.ACTIVE,
      } as any);

      const result = await (service as any).hasProjectAccess(
        mockProjectId,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectMentorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(projectVolunteerRepository, 'findOne').mockResolvedValue(null);

      const result = await (service as any).hasProjectAccess(
        mockProjectId,
        'other-user',
      );

      expect(result).toBe(false);
    });
  });
});
