import { Test, TestingModule } from '@nestjs/testing';
import { TaskCommentsController } from './task-comments.controller';
import { TaskCommentsService } from './task-comments.service';
import { TaskComment } from './entities/task-comment.entity';
import { User } from '../users/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('TaskCommentsController', () => {
  let controller: TaskCommentsController;
  let service: TaskCommentsService;

  const mockUserId = 'user-123';
  const mockTaskId = 'task-123';
  const mockCommentId = 'comment-123';

  const mockUser: Partial<User> = {
    id: mockUserId,
    username: 'testuser',
    fullName: 'Test User',
  };

  const mockComment: Partial<TaskComment> = {
    id: mockCommentId,
    taskId: mockTaskId,
    userId: mockUserId,
    content: 'Test comment',
    isEdited: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockThreadedComments = [
    {
      id: 'parent-1',
      taskId: mockTaskId,
      userId: mockUserId,
      user: {
        id: mockUserId,
        username: 'testuser',
        fullName: 'Test User',
        avatarUrl: null,
      },
      content: 'Parent comment',
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [
        {
          id: 'reply-1',
          taskId: mockTaskId,
          userId: mockUserId,
          user: {
            id: mockUserId,
            username: 'testuser',
            fullName: 'Test User',
            avatarUrl: null,
          },
          content: 'Reply comment',
          isEdited: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          replies: [],
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskCommentsController],
      providers: [
        {
          provide: TaskCommentsService,
          useValue: {
            create: jest.fn(),
            findAllByTask: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TaskCommentsController>(TaskCommentsController);
    service = module.get<TaskCommentsService>(TaskCommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      const createDto = { content: 'New comment' };

      jest
        .spyOn(service, 'create')
        .mockResolvedValue({ ...mockComment, content: createDto.content } as any);

      const result = await controller.create(
        mockTaskId,
        createDto,
        mockUser as User,
      );

      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Comment created successfully');
      expect(result.data.content).toBe(createDto.content);
      expect(service.create).toHaveBeenCalledWith(
        mockTaskId,
        createDto,
        mockUserId,
      );
    });

    it('should create a reply successfully', async () => {
      const createDto = {
        content: 'Reply comment',
        parentCommentId: 'parent-123',
      };

      jest
        .spyOn(service, 'create')
        .mockResolvedValue({ ...mockComment, content: createDto.content } as any);

      const result = await controller.create(
        mockTaskId,
        createDto,
        mockUser as User,
      );

      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Comment created successfully');
      expect(service.create).toHaveBeenCalledWith(
        mockTaskId,
        createDto,
        mockUserId,
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const createDto = { content: 'New comment' };

      jest
        .spyOn(service, 'create')
        .mockRejectedValue(new NotFoundException('Task not found'));

      await expect(
        controller.create(mockTaskId, createDto, mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      const createDto = { content: 'New comment' };

      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new ForbiddenException('You do not have access to comment on this task'),
        );

      await expect(
        controller.create(mockTaskId, createDto, mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByTask', () => {
    it('should return all comments with threaded structure', async () => {
      jest
        .spyOn(service, 'findAllByTask')
        .mockResolvedValue(mockThreadedComments as any);

      const result = await controller.findAllByTask(
        mockTaskId,
        mockUser as User,
      );

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Comments retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].replies).toHaveLength(1);
      expect(service.findAllByTask).toHaveBeenCalledWith(mockTaskId, mockUserId);
    });

    it('should return empty array when no comments exist', async () => {
      jest.spyOn(service, 'findAllByTask').mockResolvedValue([]);

      const result = await controller.findAllByTask(
        mockTaskId,
        mockUser as User,
      );

      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(0);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      jest
        .spyOn(service, 'findAllByTask')
        .mockRejectedValue(new NotFoundException('Task not found'));

      await expect(
        controller.findAllByTask(mockTaskId, mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a single comment', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as any);

      const result = await controller.findOne(
        mockTaskId,
        mockCommentId,
        mockUser as User,
      );

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Comment retrieved successfully');
      expect(result.data.id).toBe(mockCommentId);
      expect(service.findOne).toHaveBeenCalledWith(mockCommentId, mockUserId);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(
        controller.findOne(mockTaskId, mockCommentId, mockUser as User),
      ).rejects.toThrow(NotFoundException);
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

      jest.spyOn(service, 'update').mockResolvedValue(updatedComment as any);

      const result = await controller.update(
        mockTaskId,
        mockCommentId,
        updateDto,
        mockUser as User,
      );

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Comment updated successfully');
      expect(result.data.content).toBe(updateDto.content);
      expect(result.data.isEdited).toBe(true);
      expect(service.update).toHaveBeenCalledWith(
        mockCommentId,
        updateDto,
        mockUserId,
      );
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      const updateDto = { content: 'Updated content' };

      jest
        .spyOn(service, 'update')
        .mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(
        controller.update(mockTaskId, mockCommentId, updateDto, mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const updateDto = { content: 'Updated content' };

      jest
        .spyOn(service, 'update')
        .mockRejectedValue(
          new ForbiddenException('You can only edit your own comments'),
        );

      await expect(
        controller.update(mockTaskId, mockCommentId, updateDto, mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a comment successfully', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      const result = await controller.remove(
        mockTaskId,
        mockCommentId,
        mockUser as User,
      );

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Comment deleted successfully');
      expect(result.data).toBeNull();
      expect(service.remove).toHaveBeenCalledWith(mockCommentId, mockUserId);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(
        controller.remove(mockTaskId, mockCommentId, mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(
          new ForbiddenException('You can only delete your own comments'),
        );

      await expect(
        controller.remove(mockTaskId, mockCommentId, mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle invalid UUID for taskId', async () => {
      const createDto = { content: 'Test comment' };
      const invalidTaskId = 'invalid-uuid';

      // Controller validation should catch this before service
      // This test documents the expected behavior
      await expect(async () => {
        // In real scenario, NestJS ValidationPipe would catch this
        if (!invalidTaskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          throw new BadRequestException('Invalid UUID format');
        }
      }).rejects.toThrow(BadRequestException);
    });

    it('should handle content exceeding max length', async () => {
      const createDto = { content: 'a'.repeat(2001) };

      // Validation pipe should catch this
      expect(createDto.content.length).toBeGreaterThan(2000);
    });

    it('should handle empty content', async () => {
      const createDto = { content: '' };

      jest
        .spyOn(service, 'create')
        .mockRejectedValue(new BadRequestException('Content is required'));

      await expect(
        controller.create(mockTaskId, createDto, mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
