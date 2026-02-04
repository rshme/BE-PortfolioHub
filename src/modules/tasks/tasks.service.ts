import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import { User } from '../users/entities/user.entity';
import { TaskComment } from '../task-comments/entities/task-comment.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  AssignTaskDto,
  QueryTaskDto,
} from './dto';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { ProjectLevel } from '../../common/enums/project-level.enum';
import { PaginationMeta } from '../../common/interfaces/response.interface';
import { TaskStatistics } from './interfaces';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMentor)
    private readonly projectMentorRepository: Repository<ProjectMentor>,
    @InjectRepository(ProjectVolunteer)
    private readonly projectVolunteerRepository: Repository<ProjectVolunteer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Create a new task for a project
   * Only project creator or active mentors can create tasks
   */
  async create(
    projectId: string,
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<Task> {
    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['creator'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has permission to create task (creator or active mentor)
    const hasPermission = await this.canManageTasks(projectId, userId);
    if (!hasPermission) {
      throw new ForbiddenException(
        'Only project creator or active mentors can create tasks',
      );
    }

    // If assignedToId is provided, validate the assignee
    if (createTaskDto.assignedToId) {
      await this.validateTaskAssignee(projectId, createTaskDto.assignedToId);
    }

    // Create the task
    const task = this.taskRepository.create({
      ...createTaskDto,
      projectId,
      createdById: userId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Return task with relations
    return this.findOne(savedTask.id, userId);
  }

  /**
   * Find all tasks for a project with pagination and filters
   */
  async findAll(
    projectId: string,
    queryDto: QueryTaskDto,
    userId: string,
  ): Promise<{
    data: Task[];
    meta: PaginationMeta;
  }> {
    // Check if user has access to this project
    const hasAccess = await this.hasProjectAccess(projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to view tasks in this project',
      );
    }

    const {
      page = 1,
      limit = 10,
      keyword,
      status,
      priority,
      assignedToId,
      createdById,
    } = queryDto;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('task.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .leftJoinAndSelect('comments.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('(comments.parentCommentId IS NULL OR comments.id IS NULL)');

    // Apply filters
    if (keyword) {
      queryBuilder.andWhere(
        '(task.title ILIKE :keyword OR task.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (assignedToId) {
      queryBuilder.andWhere('task.assignedToId = :assignedToId', {
        assignedToId,
      });
    }

    if (createdById) {
      queryBuilder.andWhere('task.createdById = :createdById', { createdById });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('task.createdAt', 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    // Format tasks to remove sensitive data
    const formattedTasks = tasks.map((task) => this.formatTaskResponse(task));

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return { data: formattedTasks, meta };
  }

  /**
   * Find a single task by ID
   */
  async findOne(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['project', 'assignedTo', 'createdBy', 'milestone'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task's project
    const hasAccess = await this.hasProjectAccess(task.projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to view this task');
    }

    // Get comment count
    const commentCount = await this.taskCommentRepository.count({
      where: { taskId: task.id },
    });

    const formattedTask = this.formatTaskResponse(task);
    formattedTask.commentCount = commentCount;

    return formattedTask;
  }

  /**
   * Update a task
   * Project creator, active mentors, and active volunteers can update tasks
   */
  async update(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to update task
    const hasPermission = await this.canManageTasks(task.projectId, userId);
    
    // If not creator/mentor, check if user is an active volunteer in the project
    let isActiveVolunteer = false;
    if (!hasPermission) {
      const volunteer = await this.projectVolunteerRepository.findOne({
        where: {
          projectId: task.projectId,
          userId,
          status: VolunteerStatus.ACTIVE,
        },
      });
      isActiveVolunteer = !!volunteer;
    }

    if (!hasPermission && !isActiveVolunteer) {
      throw new ForbiddenException(
        'Only project creator, active mentors, or active volunteers can update tasks',
      );
    }

    // Store old status before update
    const oldStatus = task.status;
    const oldAssignedToId = task.assignedToId;

    // Update task
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    // Handle contribution score and task completion count if status changed
    if (updateTaskDto.status && oldStatus !== updateTaskDto.status) {
      const assignedUserId = updatedTask.assignedToId || oldAssignedToId;
      
      // Status changed to COMPLETED
      if (updateTaskDto.status === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
        updatedTask.completedAt = new Date();
        
        if (assignedUserId) {
          // Add contribution score based on project level
          await this.handleContributionScoreUpdate(
            task.projectId,
            assignedUserId,
            oldStatus,
            updateTaskDto.status,
          );
          
          // Increment task completion count
          await this.incrementVolunteerTaskCount(
            task.projectId,
            assignedUserId,
          );
        }
      }
      
      // Status changed FROM COMPLETED to another status
      else if (oldStatus === TaskStatus.COMPLETED && updateTaskDto.status !== TaskStatus.COMPLETED) {
        updatedTask.completedAt = undefined;
        
        if (assignedUserId) {
          // Subtract contribution score based on project level
          await this.handleContributionScoreUpdate(
            task.projectId,
            assignedUserId,
            oldStatus,
            updateTaskDto.status,
          );
          
          // Decrement task completion count
          await this.decrementVolunteerTaskCount(
            task.projectId,
            assignedUserId,
          );
        }
      }

      await this.taskRepository.save(updatedTask);
    }

    return this.findOne(updatedTask.id, userId);
  }

  /**
   * Update task status
   * Volunteers can update their own assigned tasks
   * Project creator and mentors can update any task
   */
  async updateStatus(
    taskId: string,
    updateStatusDto: UpdateTaskStatusDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions
    const canManage = await this.canManageTasks(task.projectId, userId);
    const isAssignedVolunteer =
      task.assignedToId === userId &&
      (await this.isActiveVolunteer(task.projectId, userId));

    if (!canManage && !isAssignedVolunteer) {
      throw new ForbiddenException(
        'You do not have permission to update this task status',
      );
    }

    // Update status
    task.status = updateStatusDto.status;

    // Set completed date if status is completed
    if (updateStatusDto.status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();

      // Update volunteer's task completion count
      if (task.assignedToId) {
        await this.incrementVolunteerTaskCount(
          task.projectId,
          task.assignedToId,
        );
      }
    } else if (task.completedAt) {
      // Remove completed date if status is changed from completed
      task.completedAt = undefined;
    }

    const updatedTask = await this.taskRepository.save(task);
    return this.findOne(updatedTask.id, userId);
  }

  /**
   * Assign a task to a volunteer
   * Only project creator or active mentors can assign tasks
   */
  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to assign task
    const hasPermission = await this.canManageTasks(task.projectId, userId);
    if (!hasPermission) {
      throw new ForbiddenException(
        'Only project creator or active mentors can assign tasks',
      );
    }

    // If assignedToId is provided, validate the assignee
    if (assignTaskDto.assignedToId) {
      await this.validateTaskAssignee(
        task.projectId,
        assignTaskDto.assignedToId,
      );
    }

    // Assign task
    task.assignedToId = assignTaskDto.assignedToId || undefined;
    const updatedTask = await this.taskRepository.save(task);

    return this.findOne(updatedTask.id, userId);
  }

  /**
   * Delete a task
   * Only project creator or active mentors can delete tasks
   */
  async remove(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to delete task
    const hasPermission = await this.canManageTasks(task.projectId, userId);
    if (!hasPermission) {
      throw new ForbiddenException(
        'Only project creator or active mentors can delete tasks',
      );
    }

    await this.taskRepository.remove(task);
  }

  /**
   * Get task statistics for a project
   */
  async getTaskStatistics(
    projectId: string,
    userId: string,
  ): Promise<TaskStatistics> {
    // Check if user has access to this project
    const hasAccess = await this.hasProjectAccess(projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to view task statistics for this project',
      );
    }

    const tasks = await this.taskRepository.find({
      where: { projectId },
    });

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const inProgress = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const inReview = tasks.filter(
      (t) => t.status === TaskStatus.IN_REVIEW,
    ).length;
    const completed = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const cancelled = tasks.filter(
      (t) => t.status === TaskStatus.CANCELLED,
    ).length;

    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      inReview,
      completed,
      cancelled,
      completionPercentage,
    };
  }

  /**
   * Check if user can manage tasks (create, update, delete, assign)
   * Returns true if user is project creator or active mentor
   */
  private async canManageTasks(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is project creator
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
        userId,
        status: MentorStatus.ACTIVE,
      },
    });

    return !!mentor;
  }

  /**
   * Check if user has access to a project
   * Returns true if user is creator, mentor, or volunteer
   */
  private async hasProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is project creator
    const project = await this.projectRepository.findOne({
      where: { id: projectId, creatorId: userId },
    });

    if (project) {
      return true;
    }

    // Check if user is a mentor
    const mentor = await this.projectMentorRepository.findOne({
      where: { projectId, userId },
    });

    if (mentor) {
      return true;
    }

    // Check if user is a volunteer
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: { projectId, userId },
    });

    return !!volunteer;
  }

  /**
   * Check if user is an active volunteer in the project
   */
  private async isActiveVolunteer(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: {
        projectId,
        userId,
        status: VolunteerStatus.ACTIVE,
      },
    });

    return !!volunteer;
  }

  /**
   * Validate if a user can be assigned to a task
   * User must be an active volunteer or active mentor in the project
   */
  private async validateTaskAssignee(
    projectId: string,
    userId: string,
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is an active volunteer
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: {
        projectId,
        userId,
        status: VolunteerStatus.ACTIVE,
      },
    });

    if (volunteer) {
      return;
    }

    // Check if user is an active mentor
    const mentor = await this.projectMentorRepository.findOne({
      where: {
        projectId,
        userId,
        status: MentorStatus.ACTIVE,
      },
    });

    if (mentor) {
      return;
    }

    throw new BadRequestException(
      'User must be an active volunteer or mentor to be assigned tasks',
    );
  }

  /**
   * Increment volunteer's completed task count using atomic operation
   */
  private async incrementVolunteerTaskCount(
    projectId: string,
    userId: string,
  ): Promise<void> {
    await this.projectVolunteerRepository
      .createQueryBuilder()
      .update(ProjectVolunteer)
      .set({
        tasksCompleted: () => '"tasks_completed" + 1',
      })
      .where('project_id = :projectId', { projectId })
      .andWhere('user_id = :userId', { userId })
      .execute();
  }

  /**
   * Decrement volunteer's completed task count using atomic operation
   */
  private async decrementVolunteerTaskCount(
    projectId: string,
    userId: string,
  ): Promise<void> {
    await this.projectVolunteerRepository
      .createQueryBuilder()
      .update(ProjectVolunteer)
      .set({
        tasksCompleted: () => 'GREATEST("tasks_completed" - 1, 0)',
      })
      .where('project_id = :projectId', { projectId })
      .andWhere('user_id = :userId', { userId })
      .execute();
  }

  /**
   * Handle contribution score update based on status change
   */
  private async handleContributionScoreUpdate(
    projectId: string,
    userId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus,
  ): Promise<void> {
    // Get the project to determine the difficulty level
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'level'],
    });

    if (!project) {
      return;
    }

    // Get the volunteer record
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: { projectId, userId },
    });

    if (!volunteer) {
      return;
    }

    // Calculate score based on project level
    const scoreMap: Record<ProjectLevel, number> = {
      [ProjectLevel.BEGINNER]: 30,
      [ProjectLevel.INTERMEDIATE]: 50,
      [ProjectLevel.ADVANCED]: 80,
    };

    const scoreValue = scoreMap[project.level] || 0;

    // Add score if task is being completed (atomic operation)
    if (newStatus === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
      await this.projectVolunteerRepository
        .createQueryBuilder()
        .update(ProjectVolunteer)
        .set({
          contributionScore: () => `"contribution_score" + ${scoreValue}`,
        })
        .where('project_id = :projectId', { projectId })
        .andWhere('user_id = :userId', { userId })
        .execute();

      this.loggingService.log(
        `Volunteer ${userId} earned ${scoreValue} points for completing task in ${project.level} project ${projectId}`,
        'TasksService',
      );
    }

    // Subtract score if task status is changed from completed to another status (atomic operation)
    if (oldStatus === TaskStatus.COMPLETED && newStatus !== TaskStatus.COMPLETED) {
      await this.projectVolunteerRepository
        .createQueryBuilder()
        .update(ProjectVolunteer)
        .set({
          contributionScore: () => `GREATEST("contribution_score" - ${scoreValue}, 0)`,
        })
        .where('project_id = :projectId', { projectId })
        .andWhere('user_id = :userId', { userId })
        .execute();

      this.loggingService.log(
        `Volunteer ${userId} lost ${scoreValue} points for uncompleting task in ${project.level} project ${projectId}`,
        'TasksService',
      );
    }
  }

  /**
   * Format task response to remove sensitive user data
   */
  private formatTaskResponse(task: any): any {
    const formattedTask = { ...task };

    // Format assignedTo user
    if (formattedTask.assignedTo) {
      formattedTask.assignedTo = this.formatUserData(formattedTask.assignedTo);
    }

    // Format createdBy user
    if (formattedTask.createdBy) {
      formattedTask.createdBy = this.formatUserData(formattedTask.createdBy);
    }

    // Format comments
    if (formattedTask.comments && Array.isArray(formattedTask.comments)) {
      if (formattedTask.comments.length === 0) {
        formattedTask.comments = null;
      } else {
        formattedTask.comments = formattedTask.comments.map((comment: any) => {
          const formattedComment: any = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user ? this.formatUserData(comment.user) : null,
            replies: null,
          };

          // Format replies if they exist
          if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
            formattedComment.replies = comment.replies.map((reply: any) => ({
              id: reply.id,
              content: reply.content,
              createdAt: reply.createdAt,
              updatedAt: reply.updatedAt,
              user: reply.user ? {
                id: reply.user.id,
                username: reply.user.username,
                fullName: reply.user.fullName,
                avatarUrl: reply.user.avatarUrl,
              } : null,
            }));
          }

          return formattedComment;
        });
      }
    } else {
      formattedTask.comments = null;
    }

    // Remove project details if present (keep only ID)
    if (formattedTask.project) {
      formattedTask.project = undefined;
    }

    return formattedTask;
  }

  /**
   * Format user data to remove sensitive information
   */
  private formatUserData(user: any): any {
    if (!user) return null;

    const { password, email, role, ...safeUserData } = user;
    return safeUserData;
  }
}
