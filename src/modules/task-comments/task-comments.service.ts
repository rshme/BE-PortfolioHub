import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from './entities/task-comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import { CreateTaskCommentDto, UpdateTaskCommentDto } from './dto';
import { TaskCommentWithReplies } from './interfaces';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMentor)
    private readonly projectMentorRepository: Repository<ProjectMentor>,
    @InjectRepository(ProjectVolunteer)
    private readonly projectVolunteerRepository: Repository<ProjectVolunteer>,
  ) {}

  /**
   * Check if user has access to the project (project creator, active mentor, or active volunteer)
   */
  private async hasProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is the project creator
    const project = await this.projectRepository.findOne({
      where: { id: projectId, creatorId: userId },
    });

    if (project) {
      return true;
    }

    // Check if user is an active mentor
    const mentor = await this.projectMentorRepository.findOne({
      where: {
        projectId,
        userId: userId,
        status: MentorStatus.ACTIVE,
      },
    });

    if (mentor) {
      return true;
    }

    // Check if user is an active volunteer
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: {
        projectId,
        userId: userId,
        status: VolunteerStatus.ACTIVE,
      },
    });

    return !!volunteer;
  }

  /**
   * Create a new comment on a task
   */
  async create(
    taskId: string,
    createTaskCommentDto: CreateTaskCommentDto,
    userId: string,
  ): Promise<TaskComment> {
    // Check if task exists
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to the project
    const hasAccess = await this.hasProjectAccess(task.projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to comment on this task',
      );
    }

    // If it's a reply, check if parent comment exists and belongs to the same task
    if (createTaskCommentDto.parentCommentId) {
      const parentComment = await this.taskCommentRepository.findOne({
        where: { id: createTaskCommentDto.parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.taskId !== taskId) {
        throw new BadRequestException(
          'Parent comment does not belong to this task',
        );
      }

      // Prevent deeply nested replies (max 1 level)
      if (parentComment.parentCommentId) {
        throw new BadRequestException(
          'Cannot reply to a reply. Please reply to the parent comment instead',
        );
      }
    }

    // Create the comment
    const comment = this.taskCommentRepository.create({
      ...createTaskCommentDto,
      taskId,
      userId,
    });

    const savedComment = await this.taskCommentRepository.save(comment);

    // Return comment with user relation loaded
    const result = await this.taskCommentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    if (!result) {
      throw new NotFoundException('Comment not found after creation');
    }

    return result;
  }

  /**
   * Get all comments for a task with threaded structure
   */
  async findAllByTask(
    taskId: string,
    userId: string,
  ): Promise<TaskCommentWithReplies[]> {
    // Check if task exists
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to the project
    const hasAccess = await this.hasProjectAccess(task.projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to view comments on this task',
      );
    }

    // Get all comments for the task
    const comments = await this.taskCommentRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Build threaded structure
    return this.buildThreadedComments(comments);
  }

  /**
   * Build threaded comment structure
   */
  private buildThreadedComments(
    comments: TaskComment[],
  ): TaskCommentWithReplies[] {
    const commentMap = new Map<string, TaskCommentWithReplies>();
    const rootComments: TaskCommentWithReplies[] = [];

    // First pass: Create all comment objects
    comments.forEach((comment) => {
      const commentWithReplies: TaskCommentWithReplies = {
        id: comment.id,
        taskId: comment.taskId,
        userId: comment.userId,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          fullName: comment.user.fullName,
          avatarUrl: comment.user.avatarUrl,
        },
        content: comment.content,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replies: [],
      };

      commentMap.set(comment.id, commentWithReplies);
    });

    // Second pass: Build the tree structure
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);

      if (commentWithReplies) {
        if (comment.parentCommentId) {
          // This is a reply, add it to parent's replies
          const parentComment = commentMap.get(comment.parentCommentId);
          if (parentComment) {
            parentComment.replies.push(commentWithReplies);
          }
        } else {
          // This is a root comment
          rootComments.push(commentWithReplies);
        }
      }
    });

    return rootComments;
  }

  /**
   * Get a single comment by ID
   */
  async findOne(commentId: string, userId: string): Promise<any> {
    const comment = await this.taskCommentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'task', 'replies', 'replies.user'],
      order: {
        replies: {
          createdAt: 'ASC',
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user has access to the project
    const hasAccess = await this.hasProjectAccess(
      comment.task.projectId,
      userId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to view this comment');
    }

    // Format the response with replies
    const formattedComment: any = {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        fullName: comment.user.fullName,
        avatarUrl: comment.user.avatarUrl,
      },
      content: comment.content,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: null,
    };

    // Format replies if they exist
    if (comment.replies && comment.replies.length > 0) {
      formattedComment.replies = comment.replies.map((reply) => ({
        id: reply.id,
        taskId: reply.taskId,
        userId: reply.userId,
        parentCommentId: reply.parentCommentId,
        user: {
          id: reply.user.id,
          username: reply.user.username,
          fullName: reply.user.fullName,
          avatarUrl: reply.user.avatarUrl,
        },
        content: reply.content,
        isEdited: reply.isEdited,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      }));
    }

    return formattedComment;
  }

  /**
   * Update a comment (only by the comment author)
   */
  async update(
    commentId: string,
    updateTaskCommentDto: UpdateTaskCommentDto,
    userId: string,
  ): Promise<TaskComment> {
    const comment = await this.taskCommentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'task'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the comment author can update their comment
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Update the comment
    comment.content = updateTaskCommentDto.content;
    comment.isEdited = true;

    const updatedComment = await this.taskCommentRepository.save(comment);

    const result = await this.taskCommentRepository.findOne({
      where: { id: updatedComment.id },
      relations: ['user'],
    });

    if (!result) {
      throw new NotFoundException('Comment not found after update');
    }

    return result;
  }

  /**
   * Delete a comment (only by the comment author)
   */
  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.taskCommentRepository.findOne({
      where: { id: commentId },
      relations: ['task'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the comment author can delete their comment
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete will cascade to replies automatically due to FK constraint
    await this.taskCommentRepository.remove(comment);
  }

  /**
   * Get comment count for a task
   */
  async getCommentCount(taskId: string): Promise<number> {
    return this.taskCommentRepository.count({
      where: { taskId },
    });
  }
}
