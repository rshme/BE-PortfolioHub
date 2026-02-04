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
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UpdateOnboardingProfileDto } from './dto';
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
import { UserInterest } from './entities/user-interest.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { LoggingService } from '../logging/logging.service';

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
    @InjectRepository(UserInterest)
    private readonly userInterestRepository: Repository<UserInterest>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
    private readonly loggingService: LoggingService,
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
   * Update user profile (non-authentication fields only)
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findByIdOrFail(id);

    // Validate organization if organizationId is provided
    if (updateUserDto.organizationId !== undefined) {
      if (updateUserDto.organizationId) {
        const organization = await this.organizationRepository.findOne({
          where: { id: updateUserDto.organizationId },
        });

        if (!organization) {
          throw new NotFoundException(
            `Organization with ID ${updateUserDto.organizationId} not found`,
          );
        }
      }
      // If organizationId is null or empty string, it's valid (removing organization)
    }

    // Extract skills and interests from updateUserDto to handle separately
    const { skills, interests, ...userUpdateData } = updateUserDto;

    // Update user properties (only non-authentication fields)
    Object.assign(user, userUpdateData);
    await this.usersRepository.save(user);

    // Handle skills update
    if (skills !== undefined) {
      // Validate all skills exist
      if (skills.length > 0) {
        const validSkills = await this.skillRepository.find({
          where: { id: In(skills) },
        });

        if (validSkills.length !== skills.length) {
          throw new BadRequestException('Some skill IDs are invalid');
        }
      }

      // Delete existing user skills
      await this.userSkillRepository.delete({ userId: id });

      // Create new user skills
      if (skills.length > 0) {
        const userSkills = skills.map((skillId) => ({
          userId: id,
          skillId: skillId,
        }));
        await this.userSkillRepository.save(userSkills);
      }
    }

    // Handle interests update
    if (interests !== undefined) {
      // Validate all categories exist
      if (interests.length > 0) {
        const categories = await this.categoryRepository.find({
          where: { id: In(interests) },
        });

        if (categories.length !== interests.length) {
          throw new BadRequestException('Some interest IDs are invalid');
        }
      }

      // Delete existing user interests
      await this.userInterestRepository.delete({ userId: id });

      // Create new user interests
      if (interests.length > 0) {
        const userInterests = interests.map((categoryId) => ({
          userId: id,
          categoryId: categoryId,
        }));
        await this.userInterestRepository.save(userInterests);
      }
    }

    // Return updated user with relations
    return await this.findByIdOrFail(id);
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
   * Update user onboarding profile with skills and interests
   */
  async updateOnboardingProfile(
    id: string,
    updateOnboardingProfileDto: UpdateOnboardingProfileDto,
  ): Promise<User> {
    const user = await this.findByIdOrFail(id);

    // Prepare socialLinks update
    const socialLinksUpdate: Record<string, string> = user.socialLinks ? { ...user.socialLinks } : {};
    
    if (updateOnboardingProfileDto.github) {
      socialLinksUpdate.github = updateOnboardingProfileDto.github;
    }
    
    if (updateOnboardingProfileDto.linkedin) {
      socialLinksUpdate.linkedin = updateOnboardingProfileDto.linkedin;
    }

    // Update basic profile fields
    const updateData: Partial<User> = {};
    
    if (updateOnboardingProfileDto.bio !== undefined) {
      updateData.bio = updateOnboardingProfileDto.bio;
    }
    
    if (updateOnboardingProfileDto.location !== undefined) {
      // Store location in socialLinks as well since there's no location field in User entity
      socialLinksUpdate.location = updateOnboardingProfileDto.location;
    }
    
    if (Object.keys(socialLinksUpdate).length > 0) {
      updateData.socialLinks = socialLinksUpdate;
    }

    // Update user basic fields if there are any changes
    if (Object.keys(updateData).length > 0) {
      await this.usersRepository.update(id, updateData);
    }

    // Handle skills update
    if (updateOnboardingProfileDto.skills !== undefined) {
      // Validate all skills exist
      if (updateOnboardingProfileDto.skills.length > 0) {
        const skills = await this.skillRepository.find({
          where: { id: In(updateOnboardingProfileDto.skills) },
        });

        if (skills.length !== updateOnboardingProfileDto.skills.length) {
          throw new BadRequestException('Some skill IDs are invalid');
        }
      }

      // Delete existing user skills
      await this.userSkillRepository.delete({ userId: id });

      // Create new user skills
      if (updateOnboardingProfileDto.skills.length > 0) {
        const userSkills = updateOnboardingProfileDto.skills.map((skillId) => ({
          userId: id,
          skillId: skillId,
        }));
        await this.userSkillRepository.save(userSkills);
      }
    }

    // Handle interests update
    if (updateOnboardingProfileDto.interests !== undefined) {
      // Validate all categories exist
      if (updateOnboardingProfileDto.interests.length > 0) {
        const categories = await this.categoryRepository.find({
          where: { id: In(updateOnboardingProfileDto.interests) },
        });

        if (categories.length !== updateOnboardingProfileDto.interests.length) {
          throw new BadRequestException('Some interest IDs are invalid');
        }
      }

      // Delete existing user interests
      await this.userInterestRepository.delete({ userId: id });

      // Create new user interests
      if (updateOnboardingProfileDto.interests.length > 0) {
        const userInterests = updateOnboardingProfileDto.interests.map(
          (categoryId) => ({
            userId: id,
            categoryId: categoryId,
          }),
        );
        await this.userInterestRepository.save(userInterests);
      }
    }

    // Return updated user
    return await this.findByIdOrFail(id);
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

    // Calculate account age and activity metrics
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
    const lastActiveDate = user.updatedAt || user.createdAt;
    const daysSinceLastActive = Math.floor(
      (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get statistics based on role
    let roleStats: any;
    switch (user.role) {
      case UserRole.VOLUNTEER:
        roleStats = {
          ...baseStats,
          volunteer: await this.getVolunteerStatistics(userId),
        };
        break;

      case UserRole.MENTOR:
        roleStats = {
          ...baseStats,
          mentor: await this.getMentorStatistics(userId),
        };
        break;

      case UserRole.PROJECT_OWNER:
        roleStats = {
          ...baseStats,
          creator: await this.getCreatorStatistics(userId),
        };
        break;

      case UserRole.ADMIN:
        roleStats = {
          ...baseStats,
          admin: await this.getAdminStatistics(),
          volunteer: await this.getVolunteerStatistics(userId),
          mentor: await this.getMentorStatistics(userId),
          creator: await this.getCreatorStatistics(userId),
        };
        break;

      default:
        roleStats = baseStats;
    }

    // Calculate aggregate metrics for retention tracking
    const volunteerStats = roleStats.volunteer || { projects: {}, tasks: {}, contribution: {} };
    const mentorStats = roleStats.mentor || { projects: {}, sessions: 0 };
    
    const totalContributions =
      (volunteerStats.contribution?.totalTasksCompleted || 0) +
      (volunteerStats.projects?.completed || 0);
    
    const projectsJoined = volunteerStats.projects?.total || 0;
    const projectsCompleted = volunteerStats.projects?.completed || 0;
    const tasksCompleted = volunteerStats.tasks?.completed || 0;
    const mentorshipSessions = mentorStats.sessions || 0;
    
    // Determine if user is weekly active (active within last 7 days)
    const weeklyActiveStatus = daysSinceLastActive <= 7;

    // Log portfolio metrics
    const badges = await this.userBadgeRepository.count({ where: { userId } });
    const skills = await this.userSkillRepository.count({ where: { userId } });

    // Calculate profile completeness
    const profileCompleteness = this.calculateProfileCompleteness(user, skills);

    this.loggingService.logPortfolioMetrics({
      userId: user.id,
      portfolioItemsCount: projectsJoined + totalContributions,
      verifiedContributions: totalContributions,
      testimonialsReceived: 0, // Testimonials UI not implemented
      testimonialsGiven: 0,
      badgesEarned: badges,
      profileCompleteness,
    });

    return roleStats;
  }

  /**
   * Calculate profile completeness percentage
   */
  private calculateProfileCompleteness(user: any, skillsCount: number): number {
    let completeness = 0;
    const totalFields = 8; // Total fields to check

    if (user.fullName) completeness += 12.5;
    if (user.email) completeness += 12.5;
    if (user.bio) completeness += 12.5;
    if (user.location) completeness += 12.5;
    if (user.avatarUrl) completeness += 12.5;
    if (skillsCount > 0) completeness += 12.5;
    if (user.githubUrl || user.linkedinUrl || user.portfolioUrl) completeness += 12.5;
    if (user.phoneNumber) completeness += 12.5;

    return Math.round(completeness);
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

    // Active projects: IN_PROGRESS status where mentor is ACTIVE
    const activeProjects = mentorProjects.filter(
      (mp) =>
        mp.status === MentorStatus.ACTIVE &&
        mp.project?.status === ProjectStatus.IN_PROGRESS,
    ).length;
    
    // Completed projects: COMPLETED status where mentor is ACTIVE
    const completedProjects = mentorProjects.filter(
      (mp) =>
        mp.status === MentorStatus.ACTIVE &&
        mp.project?.status === ProjectStatus.COMPLETED,
    ).length;
    
    // Mentored projects: COMPLETED or CANCELLED status where mentor is ACTIVE
    const mentoredProjects = mentorProjects.filter(
      (mp) =>
        mp.status === MentorStatus.ACTIVE &&
        (mp.project?.status === ProjectStatus.COMPLETED ||
          mp.project?.status === ProjectStatus.CANCELLED),
    ).length;
    
    // Total = mentoredProjects + active
    // Note: mentoredProjects already includes completed projects, so no need to add completedProjectsCount
    const totalProjects = mentoredProjects + activeProjects;

    // Get active mentor projects (mentor status = ACTIVE)
    const activeMentorProjects = mentorProjects.filter(
      (mp) => mp.status === MentorStatus.ACTIVE,
    );

    // Filter only projects with IN_PROGRESS or ON_HOLD status for mentoring stats
    const activeMentoringProjects = activeMentorProjects.filter(
      (mp) =>
        mp.project?.status === ProjectStatus.IN_PROGRESS ||
        mp.project?.status === ProjectStatus.ON_HOLD,
    );

    // Count total mentees (volunteers with ACTIVE status in IN_PROGRESS or ON_HOLD projects)
    const totalMentees = activeMentoringProjects.reduce((sum, mp) => {
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

    // Get projects where mentor is actively mentoring (IN_PROGRESS or ON_HOLD only)
    const activeMentoringProjectIds = activeMentoringProjects.map((mp) => mp.projectId);
    const activeProjectDetails = activeMentoringProjectIds.length > 0
      ? await this.projectRepository.find({
          where: {
            id: In(activeMentoringProjectIds),
            status: In([ProjectStatus.IN_PROGRESS, ProjectStatus.ON_HOLD]),
          },
          select: ['id', 'name', 'status', 'level'],
        })
      : [];

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
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
      relations: ['organization'],
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
    const skills = userSkills.map((us) => ({
      id: us.skill.id,
      name: us.skill.name,
    }));

    // Get user interests
    const userInterests = await this.userInterestRepository.find({
      where: { userId: user.id },
      relations: ['category'],
    });
    const interests = userInterests.map((ui) => ({
      id: ui.category.id,
      name: ui.category.name,
    }));

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
    // Only include ACTIVE volunteers to match what's shown in project details
    const volunteerProjects = await this.projectVolunteerRepository.find({
      where: { 
        userId: user.id,
        status: VolunteerStatus.ACTIVE 
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

    // Filter projects for completed/cancelled contributions
    const completedOrCancelledProjects = volunteerProjects.filter(
      (vp) =>
        vp.project?.status === ProjectStatus.COMPLETED ||
        vp.project?.status === ProjectStatus.CANCELLED,
    );

    // Filter projects for active projects (IN_PROGRESS or ON_HOLD)
    const activeProjectsList = volunteerProjects.filter(
      (vp) =>
        vp.project?.status === ProjectStatus.IN_PROGRESS ||
        vp.project?.status === ProjectStatus.ON_HOLD,
    );

    // Filter projects for stats calculation (IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
    const projectsForStats = volunteerProjects.filter(
      (vp) =>
        vp.project?.status === ProjectStatus.IN_PROGRESS ||
        vp.project?.status === ProjectStatus.ON_HOLD ||
        vp.project?.status === ProjectStatus.COMPLETED ||
        vp.project?.status === ProjectStatus.CANCELLED,
    );

    // Calculate statistics - only from relevant project statuses
    const totalProjects = completedOrCancelledProjects.length + activeProjectsList.length;
    const totalContributions = projectsForStats.reduce(
      (sum, vp) => sum + (vp.contributionScore || 0),
      0,
    );
    const totalTasksCompleted = projectsForStats.reduce(
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

    // Get total tasks for completed/cancelled projects
    const projectContributions = await Promise.all(
      completedOrCancelledProjects.map(async (vp) => {
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

    // Format active projects (IN_PROGRESS or ON_HOLD)
    const activeProjects = await Promise.all(
      activeProjectsList.map(async (vp) => {
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
      organizationId: user.organizationId,
      organization: user.organization,

      // Skills
      skills,

      // Interests
      interests,

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

      // Project Contributions (Completed/Cancelled only)
      projectContributions,

      // Active Projects (IN_PROGRESS/ON_HOLD only)
      activeProjects,
    };
  }

  /**
   * Get mentor profile by username (Public endpoint)
   */
  async getMentorProfileByUsername(username: string): Promise<any> {
    // Find user by username with organization relation
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user is a mentor
    if (user.role !== UserRole.MENTOR) {
      throw new BadRequestException(`User ${username} is not a mentor`);
    }

    // Get skills
    const userSkills = await this.userSkillRepository.find({
      where: { userId: user.id },
      relations: ['skill'],
    });
    const skills = userSkills.map((us) => ({
      id: us.skill.id,
      name: us.skill.name,
    }));

    // Get interests
    const userInterests = await this.userInterestRepository.find({
      where: { userId: user.id },
      relations: ['category'],
    });
    const interests = userInterests.map((ui) => ({
      id: ui.category.id,
      name: ui.category.name,
    }));

    // Get achievements/badges
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

    // Get all mentor projects where mentor is ACTIVE
    const mentorProjects = await this.projectMentorRepository.find({
      where: { 
        userId: user.id,
        status: MentorStatus.ACTIVE,
      },
      relations: [
        'project', 
        'project.categories', 
        'project.categories.category',
        'project.skills',
        'project.skills.skill',
        'project.volunteers',
      ],
      order: { joinedAt: 'DESC' },
    });

    // Get testimonials/reviews from volunteers who worked with this mentor
    const testimonials = await this.testimonialRepository.find({
      where: { 
        userId: user.id,
        isVisible: true,
      },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });

    // Calculate average rating from testimonials
    const totalReviews = testimonials.length;
    const averageRating = totalReviews > 0
      ? testimonials.reduce((sum, t) => sum + t.rating, 0) / totalReviews
      : 0;

    // Format reviews
    const reviews = testimonials.map((t) => ({
      id: t.id,
      rating: t.rating,
      content: t.content,
      reviewer: {
        id: t.reviewer.id,
        username: t.reviewer.username,
        fullName: t.reviewer.fullName,
        avatarUrl: t.reviewer.avatarUrl,
        role: t.reviewer.role,
      },
      createdAt: t.createdAt,
    }));

    // Calculate total tasks created by mentor across all projects
    const projectIds = mentorProjects.map((mp) => mp.projectId);
    const totalTasksCreated = projectIds.length > 0
      ? await this.taskRepository.count({
          where: { 
            projectId: In(projectIds),
            createdById: user.id,
          },
        })
      : 0;

    // Filter mentored projects: Only show COMPLETED or CANCELLED projects where mentor is ACTIVE
    const completedOrCancelledProjects = mentorProjects.filter(
      (mp) =>
        mp.project?.status === ProjectStatus.COMPLETED ||
        mp.project?.status === ProjectStatus.CANCELLED,
    );

    // Format mentored projects (only COMPLETED or CANCELLED)
    const mentoredProjects = await Promise.all(
      completedOrCancelledProjects.map(async (mp) => {
        // Get project tags (categories + skills)
        const categoryNames = mp.project.categories?.map(
          (pc: any) => pc.category.name,
        ) || [];
        const skillNames = mp.project.skills?.map(
          (ps: any) => ps.skill.name,
        ) || [];
        const projectTags = [...categoryNames, ...skillNames];

        // Count active volunteers in this project
        const volunteersGuided = mp.project.volunteers?.filter(
          (v: any) => v.status === VolunteerStatus.ACTIVE,
        ).length || 0;

        // Count tasks created by mentor in this project
        const tasksCreated = await this.taskRepository.count({
          where: { 
            projectId: mp.projectId,
            createdById: user.id,
          },
        });

        return {
          projectId: mp.project.id,
          projectName: mp.project.name,
          projectDescription: mp.project.description,
          projectStatus: mp.project.status,
          projectTags,
          volunteersGuided,
          tasksCreated,
          joinedAsmentorAt: mp.joinedAt,
          volunteersNeeded: mp.project.volunteersNeeded,
        };
      }),
    );

    // Calculate statistics for projects
    const activeProjectsCount = mentorProjects.filter(
      (mp) => mp.project?.status === ProjectStatus.IN_PROGRESS,
    ).length;
    
    const completedProjectsCount = mentorProjects.filter(
      (mp) => mp.project?.status === ProjectStatus.COMPLETED,
    ).length;
    
    // Total = mentoredProjects (completed/cancelled) + active
    // Note: mentoredProjects already includes completed projects, so no need to add completedProjectsCount
    const totalProjects = mentoredProjects.length + activeProjectsCount;

    return {
      // Basic Info
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,

      // Professional Info
      organization: user.organization ? {
        id: user.organization.id,
        name: user.organization.name,
        description: user.organization.description,
        logoUrl: user.organization.logoUrl,
        website: user.organization.website,
      } : null,

      // Skills
      skills,

      // Interests
      interests,

      // Social Links
      socialLinks: user.socialLinks || {},

      // Achievements
      achievements,

      // Mentor-Specific Stats
      stats: {
        projectsMentored: mentoredProjects.length,
        totalTasksCreated,
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews,
        activeSince: user.createdAt,
      },

      // Projects breakdown
      projects: {
        total: totalProjects,
        active: activeProjectsCount,
        completed: completedProjectsCount,
      },

      // Mentored Projects
      mentoredProjects,

      // Reviews
      reviews,
    };
  }

  /**
   * Submit survey response for thesis research
   * Used for pre-test, post-test, satisfaction surveys
   */
  async submitSurvey(userId: string, surveyDto: any): Promise<{ message: string }> {
    const user = await this.findByIdOrFail(userId);
    
    // Calculate account age for platform usage days
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const platformUsageDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    // Log survey response dengan immediate satisfaction metrics
    this.loggingService.logSurveyResponse({
      userId,
      surveyType: surveyDto.surveyType,
      responses: surveyDto.responses || {},
      susScore: surveyDto.responses?.susScore as number,
      satisfactionScore: surveyDto.overallSatisfaction,
      recommendationLikelihood: surveyDto.responses?.npsScore as number,
      perceivedUsefulness: surveyDto.responses?.perceivedUsefulness as number,
      perceivedEaseOfUse: surveyDto.responses?.perceivedEaseOfUse as number,
      testingDuration: platformUsageDays * 24, // convert to hours (approximate)
      metadata: surveyDto.metadata,
    });

    return {
      message: 'Survey submitted successfully',
    };
  }
}
