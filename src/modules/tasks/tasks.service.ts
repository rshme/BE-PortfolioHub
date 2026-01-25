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
import { PaginationMeta } from '../../common/interfaces/response.interface';
import { TaskStatistics } from './interfaces';

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
      .where('task.projectId = :projectId', { projectId });

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
      relations: ['project', 'assignedTo', 'createdBy'],
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
   * Only project creator or active mentors can update tasks
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
    if (!hasPermission) {
      throw new ForbiddenException(
        'Only project creator or active mentors can update tasks',
      );
    }

    // Update task
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

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
   * Increment volunteer's completed task count
   */
  private async incrementVolunteerTaskCount(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: { projectId, userId },
    });

    if (volunteer) {
      volunteer.tasksCompleted += 1;
      await this.projectVolunteerRepository.save(volunteer);
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
