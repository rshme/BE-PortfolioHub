import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone } from './entities/milestone.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';
import {
  MilestoneWithStatistics,
  MilestoneStatistics,
} from './interfaces/milestone.interface';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly milestoneRepository: Repository<Milestone>,
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
   * Create a new milestone
   * Only project owner or approved mentors can create milestones
   */
  async create(
    projectId: string,
    createMilestoneDto: CreateMilestoneDto,
    userId: string,
    userRole: UserRole,
  ): Promise<MilestoneWithStatistics> {
    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check authorization
    await this.checkCreateEditPermission(projectId, userId, userRole);

    // Validate dates
    if (createMilestoneDto.startDate && createMilestoneDto.endDate) {
      const startDate = new Date(createMilestoneDto.startDate);
      const endDate = new Date(createMilestoneDto.endDate);
      if (endDate < startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Create milestone
    const milestone = this.milestoneRepository.create({
      ...createMilestoneDto,
      projectId,
    });

    const savedMilestone = await this.milestoneRepository.save(milestone);

    // Return with statistics (no tasks yet)
    return {
      ...savedMilestone,
      tasks: [],
      taskCount: 0,
      completedTaskCount: 0,
      completionPercentage: 0,
    };
  }

  /**
   * Get all milestones for a project
   * Only project members can view milestones
   */
  async findAllByProject(
    projectId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<MilestoneWithStatistics[]> {
    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check if user is a member of the project
    await this.checkViewPermission(projectId, userId, userRole);

    // Get milestones with tasks
    const milestones = await this.milestoneRepository.find({
      where: { projectId },
      order: { orderPosition: 'ASC', createdAt: 'ASC' },
    });

    // Enrich milestones with statistics
    const milestonesWithStats = await Promise.all(
      milestones.map((milestone) => this.enrichWithStatistics(milestone)),
    );

    return milestonesWithStats;
  }

  /**
   * Get a single milestone by ID with full details including tasks
   */
  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<MilestoneWithStatistics> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    // Check if user is a member of the project
    await this.checkViewPermission(milestone.projectId, userId, userRole);

    // Get tasks for this milestone
    const tasks = await this.taskRepository.find({
      where: { milestoneId: id },
      relations: ['assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' },
    });

    // Calculate statistics
    const statistics = this.calculateStatistics(tasks);

    return {
      ...milestone,
      tasks,
      taskCount: statistics.totalTasks,
      completedTaskCount: statistics.completedTasks,
      completionPercentage: statistics.completionPercentage,
    };
  }

  /**
   * Update a milestone
   * Only project owner or approved mentors can update milestones
   */
  async update(
    id: string,
    updateMilestoneDto: UpdateMilestoneDto,
    userId: string,
    userRole: UserRole,
  ): Promise<MilestoneWithStatistics> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    // Check authorization
    await this.checkCreateEditPermission(
      milestone.projectId,
      userId,
      userRole,
    );

    // Validate dates if provided
    const startDate = (updateMilestoneDto as any).startDate
      ? new Date((updateMilestoneDto as any).startDate)
      : milestone.startDate;
    const endDate = (updateMilestoneDto as any).endDate
      ? new Date((updateMilestoneDto as any).endDate)
      : milestone.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Update milestone
    Object.assign(milestone, updateMilestoneDto);
    const updatedMilestone = await this.milestoneRepository.save(milestone);

    // Return with statistics
    return this.enrichWithStatistics(updatedMilestone);
  }

  /**
   * Delete a milestone
   * Only project owner or approved mentors can delete milestones
   */
  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    // Check authorization
    await this.checkCreateEditPermission(
      milestone.projectId,
      userId,
      userRole,
    );

    // Check if milestone has tasks
    const taskCount = await this.taskRepository.count({
      where: { milestoneId: id },
    });

    if (taskCount > 0) {
      throw new BadRequestException(
        'Cannot delete milestone with existing tasks. Please reassign or delete tasks first.',
      );
    }

    await this.milestoneRepository.remove(milestone);
  }

  /**
   * Get statistics for a milestone
   */
  async getStatistics(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<MilestoneStatistics> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    // Check if user is a member of the project
    await this.checkViewPermission(milestone.projectId, userId, userRole);

    // Get tasks for this milestone
    const tasks = await this.taskRepository.find({
      where: { milestoneId: id },
    });

    return this.calculateStatistics(tasks);
  }

  /**
   * Check if user has permission to view milestones
   * User must be project owner, mentor, or volunteer
   */
  private async checkViewPermission(
    projectId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    // Admin can view all
    if (userRole === UserRole.ADMIN) {
      return;
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check if user is project owner
    if (project.creatorId === userId) {
      return;
    }

    // Check if user is an approved or active mentor
    const mentor = await this.projectMentorRepository.findOne({
      where: [
        {
          projectId,
          userId,
          status: MentorStatus.APPROVED,
        },
        {
          projectId,
          userId,
          status: MentorStatus.ACTIVE,
        },
      ],
    });

    if (mentor) {
      return;
    }

    // Check if user is an approved or active volunteer
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: [
        {
          projectId,
          userId,
          status: VolunteerStatus.APPROVED,
        },
        {
          projectId,
          userId,
          status: VolunteerStatus.ACTIVE,
        },
      ],
    });

    if (volunteer) {
      return;
    }

    throw new ForbiddenException(
      'Only approved or active members can view milestones for this project',
    );
  }

  /**
   * Check if user has permission to create/edit/delete milestones
   * Only project owner or approved mentors can create/edit/delete
   */
  private async checkCreateEditPermission(
    projectId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    // Admin can do anything
    if (userRole === UserRole.ADMIN) {
      return;
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check if user is project owner
    if (project.creatorId === userId) {
      return;
    }

    // Check if user is an approved or active mentor
    const mentor = await this.projectMentorRepository.findOne({
      where: [
        {
          projectId,
          userId,
          status: MentorStatus.APPROVED,
        },
        {
          projectId,
          userId,
          status: MentorStatus.ACTIVE,
        },
      ],
    });

    if (mentor) {
      return;
    }

    throw new ForbiddenException(
      'Only project owners and approved or active mentors can create, edit, or delete milestones',
    );
  }

  /**
   * Enrich milestone with statistics
   */
  private async enrichWithStatistics(
    milestone: Milestone,
  ): Promise<MilestoneWithStatistics> {
    const tasks = await this.taskRepository.find({
      where: { milestoneId: milestone.id },
    });

    const statistics = this.calculateStatistics(tasks);

    return {
      ...milestone,
      taskCount: statistics.totalTasks,
      completedTaskCount: statistics.completedTasks,
      completionPercentage: statistics.completionPercentage,
    };
  }

  /**
   * Calculate statistics from tasks
   */
  private calculateStatistics(tasks: Task[]): MilestoneStatistics {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = tasks.filter(
      (task) => task.status === TaskStatus.TODO,
    ).length;

    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionPercentage,
    };
  }
}
