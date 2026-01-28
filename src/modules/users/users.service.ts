import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Project } from '../projects/entities/project.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { UserBadge } from './entities/user-badge.entity';
import { UserSkill } from './entities/user-skill.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectVolunteer)
    private readonly projectVolunteerRepository: Repository<ProjectVolunteer>,
    @InjectRepository(ProjectMentor)
    private readonly projectMentorRepository: Repository<ProjectMentor>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepository: Repository<UserSkill>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check both email and username in parallel for better performance
    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
      this.usersRepository.findOne({ where: { email: createUserDto.email } }),
      this.usersRepository.findOne({
        where: { username: createUserDto.username },
      }),
    ]);

    // Check email conflict first
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Then check username conflict
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.usersRepository.save(user);
  }

  /**
   * Find all users (with pagination support)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { username },
    });
  }

  /**
   * Find user by username or throw error
   */
  async findByUsernameOrFail(username: string): Promise<User> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
    });
  }

  /**
   * Find user by ID or throw error
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findByIdOrFail(id);

    // Check if email is being updated and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserByEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email, id: Not(id) },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Email is already in use');
      }
    }

    // Check if username is being updated and already exists
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUserByUsername = await this.usersRepository.findOne({
        where: { username: updateUserDto.username, id: Not(id) },
      });

      if (existingUserByUsername) {
        throw new ConflictException('Username is already in use');
      }
    }

    // Update user properties
    Object.assign(user, updateUserDto);

    return await this.usersRepository.save(user);
  }

  /**
   * Update user password
   */
  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    // Update password
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  /**
   * Soft delete user (you can implement hard delete if needed)
   */
  async remove(id: string): Promise<void> {
    const user = await this.findByIdOrFail(id);
    await this.usersRepository.remove(user);
  }

  /**
   * Search users by keyword (username, email, or fullName)
   */
  async search(
    keyword: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    const [data, total] = await queryBuilder
      .where('user.username ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('user.email ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('user.fullName ILIKE :keyword', { keyword: `%${keyword}%` })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get user statistics based on their role
   */
  async getUserStatistics(userId: string): Promise<any> {
    const user = await this.findByIdOrFail(userId);

    const baseStats = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      memberSince: user.createdAt,
    };

    // Get statistics based on role
    switch (user.role) {
      case UserRole.VOLUNTEER:
        return {
          ...baseStats,
          volunteer: await this.getVolunteerStatistics(userId),
        };

      case UserRole.MENTOR:
        return {
          ...baseStats,
          mentor: await this.getMentorStatistics(userId),
        };

      case UserRole.PROJECT_OWNER:
        return {
          ...baseStats,
          creator: await this.getCreatorStatistics(userId),
        };

      case UserRole.ADMIN:
        return {
          ...baseStats,
          admin: await this.getAdminStatistics(),
          volunteer: await this.getVolunteerStatistics(userId),
          mentor: await this.getMentorStatistics(userId),
          creator: await this.getCreatorStatistics(userId),
        };

      default:
        return baseStats;
    }
  }

  /**
   * Get volunteer-specific statistics
   */
  private async getVolunteerStatistics(userId: string): Promise<any> {
    // Get all volunteer projects
    const volunteerProjects = await this.projectVolunteerRepository.find({
      where: { userId },
      relations: ['project'],
    });

    // Count projects by status
    const totalProjects = volunteerProjects.length;
    const activeProjects = volunteerProjects.filter(
      (vp) => vp.status === VolunteerStatus.ACTIVE,
    ).length;
    const completedProjects = volunteerProjects.filter(
      (vp) =>
        vp.status === VolunteerStatus.ACTIVE &&
        vp.project?.status === ProjectStatus.COMPLETED,
    ).length;
    const pendingApplications = volunteerProjects.filter(
      (vp) => vp.status === VolunteerStatus.PENDING,
    ).length;
    const leftProjects = volunteerProjects.filter(
      (vp) => vp.status === VolunteerStatus.LEFT,
    ).length;

    // Get all tasks assigned to the user
    const tasks = await this.taskRepository.find({
      where: { assignedToId: userId },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const inReviewTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_REVIEW,
    ).length;
    const cancelledTasks = tasks.filter(
      (t) => t.status === TaskStatus.CANCELLED,
    ).length;

    // Calculate completion rate
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate average contribution score
    const activeVolunteerProjects = volunteerProjects.filter(
      (vp) => vp.status === VolunteerStatus.ACTIVE,
    );
    const totalContributionScore = activeVolunteerProjects.reduce(
      (sum, vp) => sum + (vp.contributionScore || 0),
      0,
    );
    const averageContributionScore =
      activeProjects > 0
        ? Math.round(totalContributionScore / activeProjects)
        : 0;

    // Total tasks completed across all projects
    const totalTasksCompleted = activeVolunteerProjects.reduce(
      (sum, vp) => sum + (vp.tasksCompleted || 0),
      0,
    );

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        pending: pendingApplications,
        left: leftProjects,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        inReview: inReviewTasks,
        cancelled: cancelledTasks,
        completionRate: taskCompletionRate,
      },
      contribution: {
        totalTasksCompleted,
        averageContributionScore,
      },
    };
  }

  /**
   * Get mentor-specific statistics
   */
  private async getMentorStatistics(userId: string): Promise<any> {
    // Get all mentor projects
    const mentorProjects = await this.projectMentorRepository.find({
      where: { userId },
      relations: ['project', 'project.volunteers'],
    });

    // Count projects by status
    const totalProjects = mentorProjects.length;
    const activeProjects = mentorProjects.filter(
      (mp) => mp.status === MentorStatus.ACTIVE,
    ).length;
    const completedProjects = mentorProjects.filter(
      (mp) =>
        mp.status === MentorStatus.ACTIVE &&
        mp.project?.status === ProjectStatus.COMPLETED,
    ).length;
    const pendingApplications = mentorProjects.filter(
      (mp) => mp.status === MentorStatus.PENDING,
    ).length;
    const leftProjects = mentorProjects.filter(
      (mp) => mp.status === MentorStatus.LEFT,
    ).length;

    // Count total mentees (volunteers in active mentor projects)
    const activeMentorProjects = mentorProjects.filter(
      (mp) => mp.status === MentorStatus.ACTIVE,
    );
    const totalMentees = activeMentorProjects.reduce((sum, mp) => {
      const activeVolunteers = mp.project?.volunteers?.filter(
        (v: any) => v.status === VolunteerStatus.ACTIVE,
      );
      return sum + (activeVolunteers?.length || 0);
    }, 0);

    // Get all expertise areas (unique)
    const allExpertiseAreas = mentorProjects
      .filter((mp) => mp.expertiseAreas && mp.expertiseAreas.length > 0)
      .flatMap((mp) => mp.expertiseAreas);
    const uniqueExpertiseAreas = [...new Set(allExpertiseAreas)];

    // Get projects where mentor is actively mentoring
    const activeProjectIds = activeMentorProjects.map((mp) => mp.projectId);
    const activeProjectDetails = await this.projectRepository.find({
      where: { id: In(activeProjectIds) },
      select: ['id', 'name', 'status', 'level'],
    });

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        pending: pendingApplications,
        left: leftProjects,
      },
      mentoring: {
        totalMentees,
        expertiseAreas: uniqueExpertiseAreas,
        activeProjects: activeProjectDetails,
      },
    };
  }

  /**
   * Get creator-specific statistics
   */
  private async getCreatorStatistics(userId: string): Promise<any> {
    // Get all created projects
    const createdProjects = await this.projectRepository.find({
      where: { creatorId: userId },
      relations: ['volunteers', 'mentors', 'tasks', 'milestones', 'categories', 'skills'],
    });

    // Count projects by status
    const totalProjects = createdProjects.length;
    const draftProjects = createdProjects.filter(
      (p) => p.status === ProjectStatus.DRAFT,
    ).length;
    const activeProjects = createdProjects.filter(
      (p) => p.status === ProjectStatus.ACTIVE,
    ).length;
    const completedProjects = createdProjects.filter(
      (p) => p.status === ProjectStatus.COMPLETED,
    ).length;
    const onHoldProjects = createdProjects.filter(
      (p) => p.status === ProjectStatus.ON_HOLD,
    ).length;
    const cancelledProjects = createdProjects.filter(
      (p) => p.status === ProjectStatus.CANCELLED,
    ).length;
    const verifiedProjects = createdProjects.filter((p) => p.isVerified).length;

    // Count total volunteers recruited (active)
    const totalVolunteers = createdProjects.reduce((sum, p) => {
      const activeVolunteers = p.volunteers?.filter(
        (v: any) => v.status === VolunteerStatus.ACTIVE,
      );
      return sum + (activeVolunteers?.length || 0);
    }, 0);

    // Count total mentors recruited (active)
    const totalMentors = createdProjects.reduce((sum, p) => {
      const activeMentors = p.mentors?.filter(
        (m: any) => m.status === MentorStatus.ACTIVE,
      );
      return sum + (activeMentors?.length || 0);
    }, 0);

    // Count all tasks created
    const allTasks = createdProjects.flatMap((p) => p.tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      (t: any) => t.status === TaskStatus.COMPLETED,
    ).length;
    const inProgressTasks = allTasks.filter(
      (t: any) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = allTasks.filter(
      (t: any) => t.status === TaskStatus.TODO,
    ).length;

    // Calculate task completion rate across all projects
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Count milestones
    const allMilestones = createdProjects.flatMap((p) => p.milestones || []);
    const totalMilestones = allMilestones.length;
    const completedMilestones = allMilestones.filter(
      (m: any) => m.status === 'COMPLETED',
    ).length;

    // Calculate average project completion
    const projectCompletionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    // Get most active project (by number of volunteers)
    const mostActiveProject = createdProjects.reduce(
      (max, p) => {
        const activeVolunteers = p.volunteers?.filter(
          (v: any) => v.status === VolunteerStatus.ACTIVE,
        );
        const volunteerCount = activeVolunteers?.length || 0;
        return volunteerCount > max.count
          ? { project: p, count: volunteerCount }
          : max;
      },
      { project: null as any, count: 0 },
    );

    return {
      projects: {
        total: totalProjects,
        draft: draftProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: onHoldProjects,
        cancelled: cancelledProjects,
        verified: verifiedProjects,
        completionRate: projectCompletionRate,
      },
      team: {
        totalVolunteers,
        totalMentors,
        totalTeamMembers: totalVolunteers + totalMentors,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        completionRate: taskCompletionRate,
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        completionRate:
          totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0,
      },
      mostActiveProject: mostActiveProject.project
        ? {
            id: mostActiveProject.project.id,
            name: mostActiveProject.project.name,
            status: mostActiveProject.project.status,
            volunteerCount: mostActiveProject.count,
          }
        : null,
    };
  }

  /**
   * Get admin-specific statistics (platform-wide)
   */
  private async getAdminStatistics(): Promise<any> {
    // Count all users
    const totalUsers = await this.usersRepository.count();
    const volunteers = await this.usersRepository.count({
      where: { role: UserRole.VOLUNTEER },
    });
    const mentors = await this.usersRepository.count({
      where: { role: UserRole.MENTOR },
    });
    const creators = await this.usersRepository.count({
      where: { role: UserRole.PROJECT_OWNER },
    });

    // Count all projects
    const totalProjects = await this.projectRepository.count();
    const activeProjects = await this.projectRepository.count({
      where: { status: ProjectStatus.ACTIVE },
    });
    const completedProjects = await this.projectRepository.count({
      where: { status: ProjectStatus.COMPLETED },
    });
    const verifiedProjects = await this.projectRepository.count({
      where: { isVerified: true },
    });

    // Count all tasks
    const totalTasks = await this.taskRepository.count();
    const completedTasks = await this.taskRepository.count({
      where: { status: TaskStatus.COMPLETED },
    });

    // Count all volunteers and mentors
    const totalVolunteers = await this.projectVolunteerRepository.count({
      where: { status: VolunteerStatus.ACTIVE },
    });
    const totalMentors = await this.projectMentorRepository.count({
      where: { status: MentorStatus.ACTIVE },
    });

    return {
      platform: {
        users: {
          total: totalUsers,
          volunteers,
          mentors,
          creators,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          verified: verifiedProjects,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        },
        engagement: {
          activeVolunteers: totalVolunteers,
          activeMentors: totalMentors,
        },
      },
    };
  }

  /**
   * Get volunteer profile by username with comprehensive statistics
   */
  async getVolunteerProfileByUsername(username: string): Promise<any> {
    // Find user and validate they are a volunteer
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.VOLUNTEER) {
      throw new BadRequestException('User is not a volunteer');
    }

    // Get user skills
    const userSkills = await this.userSkillRepository.find({
      where: { userId: user.id },
      relations: ['skill'],
    });
    const skills = userSkills.map((us) => us.skill.name);

    // Get user badges (achievements)
    const userBadges = await this.userBadgeRepository.find({
      where: { userId: user.id },
      relations: ['badge'],
      order: { awardedAt: 'DESC' },
    });
    const achievements = userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
      rarity: ub.badge.rarity,
      awardedAt: ub.awardedAt,
    }));

    // Get volunteer projects with full details
    const volunteerProjects = await this.projectVolunteerRepository.find({
      where: { 
        userId: user.id,
        status: In([VolunteerStatus.ACTIVE, VolunteerStatus.PENDING]) 
      },
      relations: [
        'project', 
        'project.categories', 
        'project.categories.category',
        'project.skills',
        'project.skills.skill',
      ],
      order: { joinedAt: 'DESC' },
    });

    // Calculate statistics
    const totalProjects = volunteerProjects.length;
    const totalContributions = volunteerProjects.reduce(
      (sum, vp) => sum + (vp.contributionScore || 0),
      0,
    );
    const totalTasksCompleted = volunteerProjects.reduce(
      (sum, vp) => sum + (vp.tasksCompleted || 0),
      0,
    );
    const averageScore =
      totalProjects > 0 ? Math.round(totalContributions / totalProjects) : 0;

    // Determine rank based on contribution score
    let rank = 'New';
    if (totalContributions >= 500) {
      rank = 'Elite Contributor';
    } else if (totalContributions >= 300) {
      rank = 'Advanced Contributor';
    } else if (totalContributions >= 150) {
      rank = 'Active Contributor';
    } else if (totalContributions >= 50) {
      rank = 'Rising Star';
    }

    // Get total tasks for each project
    const projectContributions = await Promise.all(
      volunteerProjects.map(async (vp) => {
        const totalTasks = await this.taskRepository.count({
          where: { projectId: vp.projectId },
        });

        // Get project tags (categories + skills)
        const categoryNames = vp.project.categories?.map(
          (pc: any) => pc.category.name,
        ) || [];
        const skillNames = vp.project.skills?.map(
          (ps: any) => ps.skill.name,
        ) || [];
        const projectTags = [...categoryNames, ...skillNames];

        return {
          projectId: vp.project.id,
          projectName: vp.project.name,
          projectDescription: vp.project.description,
          projectStatus: vp.project.status,
          projectTags,
          contributionScore: vp.contributionScore || 0,
          joinedAt: vp.joinedAt,
          tasksCompleted: vp.tasksCompleted || 0,
          tasksTotal: totalTasks,
        };
      }),
    );

    return {
      // Basic Info
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,

      // Skills
      skills,

      // Achievements
      achievements,

      // Social Links
      socialLinks: user.socialLinks || {},

      // Stats
      stats: {
        totalProjects,
        totalContributions,
        totalTasksCompleted,
        averageScore,
        rank,
        activeSince: user.createdAt,
      },

      // Project Contributions
      projectContributions,
    };
  }
}
