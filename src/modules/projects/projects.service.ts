import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Project } from './entities/project.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { ProjectMentor } from './entities/project-mentor.entity';
import { ProjectVolunteer } from './entities/project-volunteer.entity';
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from './dto';
import { CloudinaryService } from '../../config/cloudinary.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { Task } from '../tasks/entities/task.entity';
import { PaginationMeta } from '../../common/interfaces/response.interface';

@Injectable()
export class ProjectsService {
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'projects_by_creator';

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectCategory)
    private readonly projectCategoryRepository: Repository<ProjectCategory>,
    @InjectRepository(ProjectSkill)
    private readonly projectSkillRepository: Repository<ProjectSkill>,
    @InjectRepository(ProjectMentor)
    private readonly projectMentorRepository: Repository<ProjectMentor>,
    @InjectRepository(ProjectVolunteer)
    private readonly projectVolunteerRepository: Repository<ProjectVolunteer>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Create a new project
   */
  async create(
    createProjectDto: CreateProjectDto,
    creatorId: string,
    banner?: Express.Multer.File,
    images?: Express.Multer.File[],
  ): Promise<Project> {
    let bannerUrl: string | undefined;
    let imageUrls: string[] = [];

    // Upload banner to Cloudinary
    if (banner) {
      const bannerResult =
        await this.cloudinaryService.uploadProjectBanner(banner);
      bannerUrl = bannerResult.secure_url;
    }

    // Upload images to Cloudinary
    if (images && images.length > 0) {
      const uploadPromises = images.map((image) =>
        this.cloudinaryService.uploadProjectImage(image),
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map((result) => result.secure_url);
    }

    // Create project entity
    const project = this.projectRepository.create({
      ...createProjectDto,
      creatorId,
      bannerUrl,
      images: imageUrls.length > 0 ? imageUrls : undefined,
    });

    const savedProject = await this.projectRepository.save(project);

    // Handle categories and skills (required)
    await this.updateProjectRelations(
      savedProject.id,
      createProjectDto.categoryIds,
      createProjectDto.skills,
    );

    // Invalidate creator's project cache
    await this.invalidateCreatorCache(creatorId);

    // Return formatted project with all relations
    return this.findOne(savedProject.id);
  }

  /**
   * Find all projects with pagination and filters
   */
  async findAll(queryDto: QueryProjectDto): Promise<{
    data: Project[];
    meta: PaginationMeta;
  }> {
    const {
      page = 1,
      limit = 10,
      keyword,
      status,
      level,
      categoryId,
      skillId,
      creatorId,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    // Convert string isVerified to boolean
    let isVerifiedBoolean: boolean | undefined;
    if (isVerified !== undefined) {
      if (isVerified === 'true' || isVerified === '1') {
        isVerifiedBoolean = true;
      } else if (isVerified === 'false' || isVerified === '0') {
        isVerifiedBoolean = false;
      }
    }

    const skip = (page - 1) * limit;

    // Build query with QueryBuilder for complex filtering
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.creator', 'creator')
      .leftJoinAndSelect('project.verifier', 'verifier')
      .leftJoinAndSelect('project.volunteers', 'volunteers')
      .leftJoinAndSelect('volunteers.user', 'volunteerUser')
      .leftJoinAndSelect('project.mentors', 'mentors')
      .leftJoinAndSelect('mentors.user', 'mentorUser')
      .leftJoinAndSelect('project.categories', 'projectCategories')
      .leftJoinAndSelect('projectCategories.category', 'category')
      .leftJoinAndSelect('project.skills', 'projectSkills')
      .leftJoinAndSelect('projectSkills.skill', 'skill');

    // Apply filters
    if (keyword) {
      queryBuilder.andWhere(
        '(project.name ILIKE :keyword OR project.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    if (level) {
      queryBuilder.andWhere('project.level = :level', { level });
    }

    if (creatorId) {
      queryBuilder.andWhere('project.creatorId = :creatorId', { creatorId });
    }

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    if (skillId) {
      queryBuilder.andWhere('skill.id = :skillId', { skillId });
    }

    if (isVerifiedBoolean !== undefined) {
      queryBuilder.andWhere('project.isVerified = :isVerifiedBoolean', {
        isVerifiedBoolean,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const projects = await queryBuilder.getMany();

    // Map volunteer count to projects - count only ACTIVE volunteers
    const projectsWithCount = projects.map((project) => ({
      ...project,
      volunteerCount: project.volunteers
        ? project.volunteers.filter((v) => v.status === VolunteerStatus.ACTIVE)
            .length
        : 0,
    }));

    // Format projects to exclude sensitive data
    const formattedProjects = await Promise.all(
      projectsWithCount.map((project) =>
        this.formatProjectResponse(project, false),
      ),
    );

    return {
      data: formattedProjects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one project by ID with all relations
   */
  async findOne(id: string, userId?: string): Promise<Project> {
    const project = await this.findOneRaw(id);

    // Calculate volunteer count - count only ACTIVE volunteers (same as findAll)
    const volunteerCount = project.volunteers
      ? project.volunteers.filter((v) => v.status === VolunteerStatus.ACTIVE)
          .length
      : 0;

    // Add volunteer count to project
    const projectWithCount = {
      ...project,
      volunteerCount,
    };

    // Check if user has access before formatting
    let hasAccess = false;
    if (userId) {
      hasAccess = await this.hasProjectAccess(id, userId);
    }

    // Format response to exclude sensitive data and add task stats if has access
    let formattedProject = await this.formatProjectResponse(projectWithCount, hasAccess, id);

    // If userId is provided and has access, add general task statistics
    if (hasAccess) {
      const taskStats = await this.getTaskStatistics(id);
      formattedProject = {
        ...formattedProject,
        taskStatistics: taskStats,
      };
    }

    return formattedProject;
  }

  /**
   * Find one project by ID without formatting (for internal use)
   */
  private async findOneRaw(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: [
        'creator',
        'verifier',
        'volunteers',
        'volunteers.user',
        'mentors',
        'mentors.user',
        'categories',
        'categories.category',
        'skills',
        'skills.skill',
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return project;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    userRole: UserRole,
    banner?: Express.Multer.File,
    images?: Express.Multer.File[],
  ): Promise<Project> {
    // Load project without relations for update
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    // Check authorization
    if (project.creatorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this project',
      );
    }

    // Handle banner update
    if (banner) {
      // Delete old banner if exists
      if (project.bannerUrl) {
        const publicId = this.cloudinaryService.extractPublicId(
          project.bannerUrl,
        );
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }

      // Upload new banner
      const bannerResult =
        await this.cloudinaryService.uploadProjectBanner(banner);
      project.bannerUrl = bannerResult.secure_url;
    } else if (updateProjectDto.removeBanner) {
      // Remove banner if requested
      if (project.bannerUrl) {
        const publicId = this.cloudinaryService.extractPublicId(
          project.bannerUrl,
        );
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }
      project.bannerUrl = undefined;
    }

    // Handle images update
    if (images && images.length > 0) {
      const uploadPromises = images.map((image) =>
        this.cloudinaryService.uploadProjectImage(image),
      );
      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map((result) => result.secure_url);

      // Merge with existing images
      project.images = [...(project.images || []), ...newImageUrls];
    }

    // Handle image removal
    if (
      updateProjectDto.removeImages &&
      updateProjectDto.removeImages.length > 0
    ) {
      for (const imageUrl of updateProjectDto.removeImages) {
        const publicId = this.cloudinaryService.extractPublicId(imageUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }

      // Filter out removed images
      if (project.images) {
        project.images = project.images.filter(
          (img) => !updateProjectDto.removeImages!.includes(img),
        );
      }
    }

    // Update other fields
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name;
    }
    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description;
    }
    if (updateProjectDto.status !== undefined) {
      project.status = updateProjectDto.status;
    }
    if (updateProjectDto.volunteersNeeded !== undefined) {
      project.volunteersNeeded = updateProjectDto.volunteersNeeded;
    }
    if (updateProjectDto.startDate !== undefined) {
      project.startDate = new Date(updateProjectDto.startDate);
    }
    if (updateProjectDto.endDate !== undefined) {
      project.endDate = new Date(updateProjectDto.endDate);
    }
    if (updateProjectDto.links !== undefined) {
      project.links = updateProjectDto.links;
    }

    await this.projectRepository.save(project);

    // Update relations if provided
    if ('categoryIds' in updateProjectDto && updateProjectDto.categoryIds) {
      await this.updateProjectRelations(
        id,
        updateProjectDto.categoryIds,
        undefined,
      );
    }

    if ('skills' in updateProjectDto && updateProjectDto.skills) {
      await this.updateProjectRelations(
        id,
        undefined,
        updateProjectDto.skills,
      );
    }

    // Invalidate creator's project cache
    await this.invalidateCreatorCache(project.creatorId);

    // Return formatted project with all relations
    return this.findOne(id);
  }

  /**
   * Delete a project (soft delete)
   */
  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    // Load project without formatted relations
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['creator', 'volunteers', 'milestones'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    // Check authorization
    if (project.creatorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this project',
      );
    }

    // Check if project has active volunteers or milestones
    const hasVolunteers = project.volunteers && project.volunteers.length > 0;
    const hasMilestones = project.milestones && project.milestones.length > 0;

    if (hasVolunteers || hasMilestones) {
      throw new BadRequestException(
        'Cannot delete project with active volunteers or milestones. Please remove them first.',
      );
    }

    // Delete associated images from Cloudinary
    if (project.bannerUrl) {
      const publicId = this.cloudinaryService.extractPublicId(
        project.bannerUrl,
      );
      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId);
      }
    }

    if (project.images && project.images.length > 0) {
      for (const imageUrl of project.images) {
        const publicId = this.cloudinaryService.extractPublicId(imageUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }
    }

    // Delete the project (cascade will handle relations)
    await this.projectRepository.remove(project);

    // Invalidate creator's project cache
    await this.invalidateCreatorCache(project.creatorId);
  }

  /**
   * Helper method to update project categories and skills
   */
  private async updateProjectRelations(
    projectId: string,
    categoryIds?: string[],
    skills?: Array<{ skillId: string; isMandatory: boolean }>,
  ): Promise<void> {
    // Update categories
    if (categoryIds && categoryIds.length > 0) {
      // Delete existing categories for this project
      await this.projectCategoryRepository.delete({ projectId });

      // Insert new categories
      const projectCategories = categoryIds.map((categoryId) =>
        this.projectCategoryRepository.create({
          projectId,
          categoryId,
        }),
      );
      await this.projectCategoryRepository.save(projectCategories);
    }

    // Update skills
    if (skills && skills.length > 0) {
      // Delete existing skills for this project
      await this.projectSkillRepository.delete({ projectId });

      // Insert new skills with isMandatory flag
      const projectSkills = skills.map((skill) =>
        this.projectSkillRepository.create({
          projectId,
          skillId: skill.skillId,
          isMandatory: skill.isMandatory,
        }),
      );
      await this.projectSkillRepository.save(projectSkills);
    }
  }

  /**
   * Helper method to format user data without sensitive information
   */
  private formatUserData(user: any): any {
    if (!user) return null;

    const { password, role, email, ...safeUserData } = user;
    return safeUserData;
  }

  /**
   * Helper method to format project response without sensitive data
   */
  private async formatProjectResponse(project: any, hasAccess: boolean = false, projectId?: string): Promise<any> {
    // Format creator
    if (project.creator) {
      project.creator = this.formatUserData(project.creator);
    }

    // Format volunteers - extract only ACTIVE volunteers
    if (
      project.volunteers &&
      Array.isArray(project.volunteers) &&
      project.volunteers.length > 0
    ) {
      const activeVolunteers = project.volunteers
        .filter((pv: any) => pv.status === VolunteerStatus.ACTIVE)
        .map((pv: any) => ({
          id: pv.id,
          status: pv.status,
          contributionScore: pv.contributionScore,
          tasksCompleted: pv.tasksCompleted,
          joinedAt: pv.joinedAt,
          leftAt: pv.leftAt || null,
          user: pv.user ? this.formatUserData(pv.user) : null,
        }));
      
      // Add task statistics per volunteer if user has project access
      if (hasAccess && projectId && activeVolunteers.length > 0) {
        project.volunteers = await this.addVolunteerTaskStatistics(
          activeVolunteers,
          projectId,
        );
      } else {
        project.volunteers = activeVolunteers.length > 0 ? activeVolunteers : null;
      }
    } else {
      project.volunteers = null;
    }

    // Format mentors - extract only ACTIVE mentors
    if (
      project.mentors &&
      Array.isArray(project.mentors) &&
      project.mentors.length > 0
    ) {
      const activeMentors = project.mentors
        .filter((pm: any) => pm.status === MentorStatus.ACTIVE)
        .map((pm: any) => ({
          id: pm.id,
          status: pm.status,
          expertiseAreas: pm.expertiseAreas || null,
          joinedAt: pm.joinedAt,
          leftAt: pm.leftAt || null,
          user: pm.user ? this.formatUserData(pm.user) : null,
        }));
      project.mentors = activeMentors.length > 0 ? activeMentors : null;
    } else {
      project.mentors = null;
    }

    // Format skills - extract only skill data
    if (
      project.skills &&
      Array.isArray(project.skills) &&
      project.skills.length > 0
    ) {
      project.skills = project.skills
        .map((ps: any) =>
          ps.skill
            ? {
                id: ps.skill.id,
                name: ps.skill.name,
                icon: ps.skill.icon || null,
                isMandatory: ps.isMandatory || false,
              }
            : null,
        )
        .filter((skill: any) => skill !== null);
    } else {
      project.skills = null;
    }

    // Format categories - extract only category data
    if (
      project.categories &&
      Array.isArray(project.categories) &&
      project.categories.length > 0
    ) {
      project.categories = project.categories
        .map((pc: any) =>
          pc.category
            ? {
                id: pc.category.id,
                name: pc.category.name,
                icon: pc.category.icon || null,
                description: pc.category.description || null,
              }
            : null,
        )
        .filter((category: any) => category !== null);
    } else {
      project.categories = null;
    }

    // Format verifier - extract only necessary data
    if (project.verifier) {
      project.verifier = this.formatUserData(project.verifier);
    }

    return project;
  }

  /**
   * Verify or unverify a project (Admin only)
   */
  async verifyProject(
    projectId: string,
    verifierId: string,
    isVerified: boolean,
  ): Promise<Project> {
    const project = await this.findOneRaw(projectId);

    // Update verification status
    project.isVerified = isVerified;
    project.verifiedBy = isVerified ? verifierId : undefined;

    await this.projectRepository.save(project);

    // Return formatted project with all relations
    return this.findOne(projectId);
  }

  // ==================== MENTOR OPERATIONS ====================

  /**
   * Apply as mentor to a project
   */
  async applyAsMentor(
    projectId: string,
    userId: string,
    applicationMessage?: string,
    expertiseAreas?: string[],
  ): Promise<ProjectMentor> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check if user is the project creator
    if (project.creatorId === userId) {
      throw new BadRequestException(
        'Project creator cannot apply as a mentor to their own project',
      );
    }

    // Check if user already applied or is a mentor
    const existingMentor = await this.projectMentorRepository.findOne({
      where: { projectId, userId },
    });

    if (existingMentor) {
      if (
        existingMentor.status === MentorStatus.PENDING ||
        existingMentor.status === MentorStatus.APPROVED ||
        existingMentor.status === MentorStatus.ACTIVE
      ) {
        throw new ConflictException(
          'You have already applied or are already a mentor for this project',
        );
      }
    }

    // Create mentor application
    const mentor = this.projectMentorRepository.create({
      projectId,
      userId,
      applicationMessage,
      expertiseAreas,
      status: MentorStatus.PENDING,
    });

    return this.projectMentorRepository.save(mentor);
  }

  /**
   * Accept invitation as mentor
   */
  async acceptMentorInvitation(
    projectId: string,
    userId: string,
  ): Promise<ProjectMentor> {
    const mentor = await this.projectMentorRepository.findOne({
      where: {
        projectId,
        userId,
        status: MentorStatus.PENDING,
      },
      relations: ['inviter'],
    });

    if (!mentor) {
      throw new NotFoundException(
        'Mentor invitation not found or already processed',
      );
    }

    // Check if this is an invitation (has invitedBy)
    if (!mentor.invitedBy) {
      throw new BadRequestException(
        'This is not an invitation. Use the apply endpoint instead.',
      );
    }

    mentor.status = MentorStatus.ACTIVE;
    return this.projectMentorRepository.save(mentor);
  }

  /**
   * Invite user as mentor to project
   */
  async inviteMentor(
    projectId: string,
    targetUserId: string,
    inviterId: string,
    inviterRole: UserRole,
    expertiseAreas?: string[],
  ): Promise<ProjectMentor> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['volunteers'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization - only creator or admin can invite
    if (project.creatorId !== inviterId && inviterRole !== UserRole.ADMIN) {
      // Check if inviter is an active volunteer
      const isActiveVolunteer = project.volunteers?.some(
        (v: any) =>
          v.userId === inviterId &&
          (v.status === VolunteerStatus.ACTIVE ||
            v.status === VolunteerStatus.APPROVED),
      );

      if (!isActiveVolunteer) {
        throw new ForbiddenException(
          'Only project creator, active volunteers, or admins can invite mentors',
        );
      }
    }

    // Check if target user is the project creator
    if (project.creatorId === targetUserId) {
      throw new BadRequestException(
        'Cannot invite project creator as a mentor',
      );
    }

    // Check if user already invited or is a mentor
    const existingMentor = await this.projectMentorRepository.findOne({
      where: { projectId, userId: targetUserId },
    });

    if (existingMentor) {
      if (
        existingMentor.status === MentorStatus.PENDING ||
        existingMentor.status === MentorStatus.APPROVED ||
        existingMentor.status === MentorStatus.ACTIVE
      ) {
        throw new ConflictException(
          'User is already invited or is a mentor for this project',
        );
      }
    }

    // Create mentor invitation
    const mentor = this.projectMentorRepository.create({
      projectId,
      userId: targetUserId,
      invitedBy: inviterId,
      expertiseAreas,
      status: MentorStatus.PENDING,
    });

    return this.projectMentorRepository.save(mentor);
  }

  /**
   * Approve mentor application
   */
  async approveMentor(
    projectId: string,
    mentorId: string,
    approverId: string,
    approverRole: UserRole,
  ): Promise<ProjectMentor> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization
    if (project.creatorId !== approverId && approverRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only project creator or admin can approve mentors',
      );
    }

    const mentor = await this.projectMentorRepository.findOne({
      where: { userId: mentorId, projectId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor application not found');
    }

    if (mentor.status !== MentorStatus.PENDING) {
      throw new BadRequestException(
        'Only pending mentor applications can be approved',
      );
    }

    mentor.status = MentorStatus.ACTIVE;
    return this.projectMentorRepository.save(mentor);
  }

  /**
   * Reject mentor application
   */
  async rejectMentor(
    projectId: string,
    mentorId: string,
    rejecterId: string,
    rejecterRole: UserRole,
  ): Promise<ProjectMentor> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization
    if (project.creatorId !== rejecterId && rejecterRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only project creator or admin can reject mentors',
      );
    }

    const mentor = await this.projectMentorRepository.findOne({
      where: { userId: mentorId, projectId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor application not found');
    }

    if (mentor.status !== MentorStatus.PENDING) {
      throw new BadRequestException(
        'Only pending mentor applications can be rejected',
      );
    }

    mentor.status = MentorStatus.REJECTED;
    return this.projectMentorRepository.save(mentor);
  }

  /**
   * Leave as mentor from project
   */
  async leaveMentor(projectId: string, userId: string): Promise<ProjectMentor> {
    const mentor = await this.projectMentorRepository.findOne({
      where: {
        projectId,
        userId,
        status: In([MentorStatus.ACTIVE, MentorStatus.APPROVED]),
      },
    });

    if (!mentor) {
      throw new NotFoundException(
        'Active mentor record not found for this project',
      );
    }

    mentor.status = MentorStatus.LEFT;
    mentor.leftAt = new Date();
    return this.projectMentorRepository.save(mentor);
  }

  /**
   * Get all mentors for a project
   */
  async getProjectMentors(
    projectId: string,
    userId: string,
    userRole: UserRole,
    status?: MentorStatus,
  ): Promise<ProjectMentor[]> {
    // Only creator and admin can access this endpoint
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userRole !== UserRole.ADMIN && project.creatorId !== userId) {
      throw new ForbiddenException(
        'Only project creator and admin can view project mentors',
      );
    }

    const whereCondition: any = { projectId };

    if (status) {
      whereCondition.status = status;
    }

    const mentors = await this.projectMentorRepository.find({
      where: whereCondition,
      relations: ['user', 'inviter'],
      order: { joinedAt: 'DESC' },
    });

    // Format response to remove sensitive user data
    return mentors.map((mentor) => ({
      ...mentor,
      user: this.formatUserData(mentor.user),
      inviter: this.formatUserData(mentor.inviter),
    }));
  }

  /**
   * Get pending mentor applications for a project
   */
  async getPendingMentors(
    projectId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ProjectMentor[]> {
    // Only creator and admin can view pending mentors
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userRole !== UserRole.ADMIN && project.creatorId !== userId) {
      throw new ForbiddenException(
        'Only project creator and admin can view pending mentor applications',
      );
    }

    const pendingMentors = await this.projectMentorRepository.find({
      where: { projectId, status: MentorStatus.PENDING },
      relations: ['user', 'inviter'],
      order: { joinedAt: 'DESC' },
    });

    // Format response to remove sensitive user data
    return pendingMentors.map((mentor) => ({
      ...mentor,
      user: this.formatUserData(mentor.user),
      inviter: this.formatUserData(mentor.inviter),
    }));
  }

  // ==================== VOLUNTEER OPERATIONS ====================

  /**
   * Apply as volunteer to a project
   */
  async applyAsVolunteer(
    projectId: string,
    userId: string,
    applicationMessage?: string,
  ): Promise<ProjectVolunteer> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check if user is the project creator
    if (project.creatorId === userId) {
      throw new BadRequestException(
        'Project creator cannot apply as a volunteer to their own project',
      );
    }

    // Check if user already applied or is a volunteer
    const existingVolunteer = await this.projectVolunteerRepository.findOne({
      where: { projectId, userId },
    });

    if (existingVolunteer) {
      if (
        existingVolunteer.status === VolunteerStatus.PENDING ||
        existingVolunteer.status === VolunteerStatus.APPROVED ||
        existingVolunteer.status === VolunteerStatus.ACTIVE
      ) {
        throw new ConflictException(
          'You have already applied or are already a volunteer for this project',
        );
      }
    }

    // Create volunteer application
    const volunteer = this.projectVolunteerRepository.create({
      projectId,
      userId,
      applicationMessage,
      status: VolunteerStatus.PENDING,
    });

    return this.projectVolunteerRepository.save(volunteer);
  }

  /**
   * Accept invitation as volunteer
   */
  async acceptVolunteerInvitation(
    projectId: string,
    userId: string,
  ): Promise<ProjectVolunteer> {
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: {
        projectId,
        userId,
        status: VolunteerStatus.PENDING,
      },
      relations: ['inviter'],
    });

    if (!volunteer) {
      throw new NotFoundException(
        'Volunteer invitation not found or already processed',
      );
    }

    // Check if this is an invitation (has invitedBy)
    if (!volunteer.invitedBy) {
      throw new BadRequestException(
        'This is not an invitation. Use the apply endpoint instead.',
      );
    }

    volunteer.status = VolunteerStatus.ACTIVE;
    await this.projectVolunteerRepository.save(volunteer);

    // Update volunteer count
    await this.updateVolunteerCount(projectId);

    return volunteer;
  }

  /**
   * Invite user as volunteer to project
   */
  async inviteVolunteer(
    projectId: string,
    targetUserId: string,
    inviterId: string,
    inviterRole: UserRole,
  ): Promise<ProjectVolunteer> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization - only creator or admin can invite
    if (project.creatorId !== inviterId && inviterRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only project creator or admin can invite volunteers',
      );
    }

    // Check if target user is the project creator
    if (project.creatorId === targetUserId) {
      throw new BadRequestException(
        'Cannot invite project creator as a volunteer',
      );
    }

    // Check if user already invited or is a volunteer
    const existingVolunteer = await this.projectVolunteerRepository.findOne({
      where: { projectId, userId: targetUserId },
    });

    if (existingVolunteer) {
      if (
        existingVolunteer.status === VolunteerStatus.PENDING ||
        existingVolunteer.status === VolunteerStatus.APPROVED ||
        existingVolunteer.status === VolunteerStatus.ACTIVE
      ) {
        throw new ConflictException(
          'User is already invited or is a volunteer for this project',
        );
      }
    }

    // Create volunteer invitation
    const volunteer = this.projectVolunteerRepository.create({
      projectId,
      userId: targetUserId,
      invitedBy: inviterId,
      status: VolunteerStatus.PENDING,
    });

    return this.projectVolunteerRepository.save(volunteer);
  }

  /**
   * Approve volunteer application
   */
  async approveVolunteer(
    projectId: string,
    volunteerId: string,
    approverId: string,
    approverRole: UserRole,
  ): Promise<ProjectVolunteer> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization
    if (project.creatorId !== approverId && approverRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only project creator or admin can approve volunteers',
      );
    }

    const volunteer = await this.projectVolunteerRepository.findOne({
      where: { userId: volunteerId, projectId },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer application not found');
    }

    if (volunteer.status !== VolunteerStatus.PENDING) {
      throw new BadRequestException(
        'Only pending volunteer applications can be approved',
      );
    }

    volunteer.status = VolunteerStatus.ACTIVE;
    await this.projectVolunteerRepository.save(volunteer);

    // Update volunteer count
    await this.updateVolunteerCount(projectId);

    return volunteer;
  }

  /**
   * Reject volunteer application
   */
  async rejectVolunteer(
    projectId: string,
    volunteerId: string,
    rejecterId: string,
    rejecterRole: UserRole,
  ): Promise<ProjectVolunteer> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization
    if (project.creatorId !== rejecterId && rejecterRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only project creator or admin can reject volunteers',
      );
    }

    const volunteer = await this.projectVolunteerRepository.findOne({
      where: { userId: volunteerId, projectId },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer application not found');
    }

    if (volunteer.status !== VolunteerStatus.PENDING) {
      throw new BadRequestException(
        'Only pending volunteer applications can be rejected',
      );
    }

    volunteer.status = VolunteerStatus.REJECTED;
    return this.projectVolunteerRepository.save(volunteer);
  }

  /**
   * Remove volunteer from project (by creator/admin)
   */
  async removeVolunteer(
    projectId: string,
    volunteerId: string,
    removerId: string,
    removerRole: UserRole,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Check authorization
    if (project.creatorId !== removerId && removerRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only project creator or admin can remove volunteers',
      );
    }

    const volunteer = await this.projectVolunteerRepository.findOne({
      where: { userId: volunteerId, projectId },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer not found');
    }

    volunteer.status = VolunteerStatus.LEFT;
    volunteer.leftAt = new Date();
    await this.projectVolunteerRepository.save(volunteer);

    // Update volunteer count
    await this.updateVolunteerCount(projectId);
  }

  /**
   * Leave as volunteer from project
   */
  async leaveVolunteer(
    projectId: string,
    userId: string,
  ): Promise<ProjectVolunteer> {
    const volunteer = await this.projectVolunteerRepository.findOne({
      where: {
        projectId,
        userId,
        status: In([VolunteerStatus.ACTIVE, VolunteerStatus.APPROVED]),
      },
    });

    if (!volunteer) {
      throw new NotFoundException(
        'Active volunteer record not found for this project',
      );
    }

    volunteer.status = VolunteerStatus.LEFT;
    volunteer.leftAt = new Date();
    await this.projectVolunteerRepository.save(volunteer);

    // Update volunteer count
    await this.updateVolunteerCount(projectId);

    return volunteer;
  }

  /**
   * Get all volunteers for a project
   */
  async getProjectVolunteers(
    projectId: string,
    userId: string,
    userRole: UserRole,
    status?: VolunteerStatus,
  ): Promise<ProjectVolunteer[]> {
    // Creator, admin, and active mentors can access this endpoint
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access (admin, creator, or active mentor)
    const isAdmin = userRole === UserRole.ADMIN;
    const isCreator = project.creatorId === userId;
    
    // Check if user is an active mentor in this project
    let isActiveMentor = false;
    if (!isAdmin && !isCreator) {
      const mentorRecord = await this.projectMentorRepository.findOne({
        where: {
          projectId,
          userId,
          status: MentorStatus.ACTIVE,
        },
      });
      isActiveMentor = !!mentorRecord;
    }

    // If user is not admin, creator, or active mentor, throw forbidden error
    if (!isAdmin && !isCreator && !isActiveMentor) {
      throw new ForbiddenException(
        'Only project creator, admin, and active mentors can view project volunteers',
      );
    }

    const whereCondition: any = { projectId };

    if (status) {
      whereCondition.status = status;
    }

    const volunteers = await this.projectVolunteerRepository.find({
      where: whereCondition,
      relations: ['user', 'inviter'],
      order: { joinedAt: 'DESC' },
    });

    // Format response to remove sensitive user data
    return volunteers.map((volunteer) => ({
      ...volunteer,
      user: this.formatUserData(volunteer.user),
      inviter: this.formatUserData(volunteer.inviter),
    }));
  }

  /**
   * Get pending volunteer applications for a project
   */
  async getPendingVolunteers(
    projectId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ProjectVolunteer[]> {
    // Only creator and admin can view pending volunteers
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userRole !== UserRole.ADMIN && project.creatorId !== userId) {
      throw new ForbiddenException(
        'Only project creator and admin can view pending volunteer applications',
      );
    }

    const pendingVolunteers = await this.projectVolunteerRepository.find({
      where: { projectId, status: VolunteerStatus.PENDING },
      relations: ['user', 'inviter'],
      order: { joinedAt: 'DESC' },
    });

    // Format response to remove sensitive user data
    return pendingVolunteers.map((volunteer) => ({
      ...volunteer,
      user: this.formatUserData(volunteer.user),
      inviter: this.formatUserData(volunteer.inviter),
    }));
  }

  /**
   * Update volunteer count for a project
   */
  private async updateVolunteerCount(projectId: string): Promise<void> {
    const count = await this.projectVolunteerRepository.count({
      where: {
        projectId,
        status: In([VolunteerStatus.ACTIVE, VolunteerStatus.APPROVED]),
      },
    });

    await this.projectRepository.update(projectId, {
      volunteerCount: count,
    });
  }

  /**
   * Get task statistics for a project
   */
  private async getTaskStatistics(projectId: string) {
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
   * Get task statistics for a specific volunteer
   */
  private async getVolunteerTaskStatistics(projectId: string, userId: string) {
    const tasks = await this.taskRepository.find({
      where: { projectId, assignedToId: userId },
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
   * Add task statistics to each volunteer (async wrapper for Promise.all)
   */
  private async addVolunteerTaskStatistics(
    volunteers: any[],
    projectId: string,
  ): Promise<any[]> {
    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const taskStatistics = await this.getVolunteerTaskStatistics(
          projectId,
          volunteer.user.id,
        );
        return {
          ...volunteer,
          taskStatistics,
        };
      }),
    );
    return volunteersWithStats;
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
   * Find all projects by creator ID with relations and caching
   */
  async findByCreatorId(creatorId: string): Promise<Project[]> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}:${creatorId}`;
    const cached = await this.cacheManager.get<Project[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // If not cached, fetch from database
    const projects = await this.projectRepository.find({
      where: { creatorId },
      relations: [
        'creator',
        'verifier',
        'volunteers',
        'volunteers.user',
        'mentors',
        'mentors.user',
        'categories',
        'categories.category',
        'skills',
        'skills.skill',
        'milestones',
        'tasks',
      ],
      order: { createdAt: 'DESC' },
    });

    // Format each project response
    const formattedProjects = await Promise.all(
      projects.map((project) => this.formatProjectResponse(project, true, project.id)),
    );

    // Cache the results
    await this.cacheManager.set(cacheKey, formattedProjects, this.CACHE_TTL);

    return formattedProjects;
  }

  /**
   * Invalidate cache for a specific creator
   */
  async invalidateCreatorCache(creatorId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}:${creatorId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Get comprehensive statistics for a project
   */
  async getProjectStatistics(projectId: string): Promise<any> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: [
        'volunteers',
        'mentors',
        'tasks',
        'milestones',
        'categories',
        'skills',
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Count volunteers by status
    const volunteerStats = {
      total: project.volunteers?.length || 0,
      active: project.volunteers?.filter(
        (v: any) => v.status === VolunteerStatus.ACTIVE,
      ).length || 0,
      pending: project.volunteers?.filter(
        (v: any) => v.status === VolunteerStatus.PENDING,
      ).length || 0,
      rejected: project.volunteers?.filter(
        (v: any) => v.status === VolunteerStatus.REJECTED,
      ).length || 0,
      left: project.volunteers?.filter(
        (v: any) => v.status === VolunteerStatus.LEFT,
      ).length || 0,
    };

    // Count mentors by status
    const mentorStats = {
      total: project.mentors?.length || 0,
      active: project.mentors?.filter(
        (m: any) => m.status === MentorStatus.ACTIVE,
      ).length || 0,
      pending: project.mentors?.filter(
        (m: any) => m.status === MentorStatus.PENDING,
      ).length || 0,
      rejected: project.mentors?.filter(
        (m: any) => m.status === MentorStatus.REJECTED,
      ).length || 0,
      left: project.mentors?.filter(
        (m: any) => m.status === MentorStatus.LEFT,
      ).length || 0,
    };

    // Count tasks by status
    const taskStats = {
      total: project.tasks?.length || 0,
      todo: project.tasks?.filter(
        (t: any) => t.status === TaskStatus.TODO,
      ).length || 0,
      inProgress: project.tasks?.filter(
        (t: any) => t.status === TaskStatus.IN_PROGRESS,
      ).length || 0,
      inReview: project.tasks?.filter(
        (t: any) => t.status === TaskStatus.IN_REVIEW,
      ).length || 0,
      completed: project.tasks?.filter(
        (t: any) => t.status === TaskStatus.COMPLETED,
      ).length || 0,
      cancelled: project.tasks?.filter(
        (t: any) => t.status === TaskStatus.CANCELLED,
      ).length || 0,
    };

    // Calculate task completion percentage
    taskStats['completionPercentage'] =
      taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

    // Count milestones by status
    const milestoneStats = {
      total: project.milestones?.length || 0,
      notStarted: project.milestones?.filter(
        (m: any) => m.status === 'NOT_STARTED',
      ).length || 0,
      inProgress: project.milestones?.filter(
        (m: any) => m.status === 'IN_PROGRESS',
      ).length || 0,
      completed: project.milestones?.filter(
        (m: any) => m.status === 'COMPLETED',
      ).length || 0,
      onHold: project.milestones?.filter(
        (m: any) => m.status === 'ON_HOLD',
      ).length || 0,
    };

    // Calculate milestone completion percentage
    milestoneStats['completionPercentage'] =
      milestoneStats.total > 0
        ? Math.round((milestoneStats.completed / milestoneStats.total) * 100)
        : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      projectLevel: project.level,
      isVerified: project.isVerified,
      volunteers: volunteerStats,
      mentors: mentorStats,
      tasks: taskStats,
      milestones: milestoneStats,
      categories: project.categories?.length || 0,
      skills: project.skills?.length || 0,
      volunteersNeeded: project.volunteersNeeded,
      volunteersFillPercentage: project.volunteersNeeded > 0
        ? Math.round((volunteerStats.active / project.volunteersNeeded) * 100)
        : 0,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
