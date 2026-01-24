import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from './dto';
import { CloudinaryService } from '../../config/cloudinary.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaginationMeta } from '../../common/interfaces/response.interface';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectCategory)
    private readonly projectCategoryRepository: Repository<ProjectCategory>,
    @InjectRepository(ProjectSkill)
    private readonly projectSkillRepository: Repository<ProjectSkill>,
    private readonly cloudinaryService: CloudinaryService,
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
      const bannerResult = await this.cloudinaryService.uploadProjectBanner(banner);
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
      createProjectDto.skillIds,
    );

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
      categoryId,
      skillId,
      creatorId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build query with QueryBuilder for complex filtering
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.creator', 'creator')
      .leftJoin('project.volunteers', 'volunteers')
      .leftJoinAndSelect('project.categories', 'projectCategories')
      .leftJoinAndSelect('projectCategories.category', 'category')
      .leftJoinAndSelect('project.skills', 'projectSkills')
      .leftJoinAndSelect('projectSkills.skill', 'skill')
      .addSelect('COUNT(DISTINCT volunteers.id)', 'volunteerCount')
      .groupBy('project.id')
      .addGroupBy('creator.id')
      .addGroupBy('projectCategories.projectId')
      .addGroupBy('projectCategories.categoryId')
      .addGroupBy('category.id')
      .addGroupBy('projectSkills.projectId')
      .addGroupBy('projectSkills.skillId')
      .addGroupBy('skill.id');

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

    if (creatorId) {
      queryBuilder.andWhere('project.creatorId = :creatorId', { creatorId });
    }

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    if (skillId) {
      queryBuilder.andWhere('skill.id = :skillId', { skillId });
    }

    // Apply sorting
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const projects = await queryBuilder.getRawAndEntities();

    // Map volunteer count to projects
    const projectsWithCount = projects.entities.map((project, index) => ({
      ...project,
      volunteerCount: parseInt(projects.raw[index].volunteerCount) || 0,
    }));

    // Format projects to exclude sensitive data
    const formattedProjects = projectsWithCount.map((project) =>
      this.formatProjectResponse(project),
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
  async findOne(id: string): Promise<Project> {
    const project = await this.findOneRaw(id);

    // Format response to exclude sensitive data
    return this.formatProjectResponse(project);
  }

  /**
   * Find one project by ID without formatting (for internal use)
   */
  private async findOneRaw(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: [
        'creator',
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
      const bannerResult = await this.cloudinaryService.uploadProjectBanner(banner);
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
    if (updateProjectDto.removeImages && updateProjectDto.removeImages.length > 0) {
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

    if ('skillIds' in updateProjectDto && updateProjectDto.skillIds) {
      await this.updateProjectRelations(
        id,
        undefined,
        updateProjectDto.skillIds,
      );
    }

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
      relations: ['creator', 'volunteers', 'tasks'],
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

    // Check if project has active volunteers or tasks
    const hasVolunteers = project.volunteers && project.volunteers.length > 0;
    const hasTasks = project.tasks && project.tasks.length > 0;

    if (hasVolunteers || hasTasks) {
      throw new BadRequestException(
        'Cannot delete project with active volunteers or tasks. Please remove them first.',
      );
    }

    // Delete associated images from Cloudinary
    if (project.bannerUrl) {
      const publicId = this.cloudinaryService.extractPublicId(project.bannerUrl);
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
  }

  /**
   * Helper method to update project categories and skills
   */
  private async updateProjectRelations(
    projectId: string,
    categoryIds?: string[],
    skillIds?: string[],
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
    if (skillIds && skillIds.length > 0) {
      // Delete existing skills for this project
      await this.projectSkillRepository.delete({ projectId });

      // Insert new skills
      const projectSkills = skillIds.map((skillId) =>
        this.projectSkillRepository.create({
          projectId,
          skillId,
          isMandatory: false,
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
  private formatProjectResponse(project: any): any {
    // Format creator
    if (project.creator) {
      project.creator = this.formatUserData(project.creator);
    }

    // Format volunteers - extract only necessary data
    if (project.volunteers && Array.isArray(project.volunteers) && project.volunteers.length > 0) {
      project.volunteers = project.volunteers.map((pv: any) => ({
        id: pv.id,
        status: pv.status,
        contributionScore: pv.contributionScore,
        tasksCompleted: pv.tasksCompleted,
        joinedAt: pv.joinedAt,
        leftAt: pv.leftAt || null,
        user: pv.user ? this.formatUserData(pv.user) : null,
      }));
    } else {
      project.volunteers = null;
    }

    // Format mentors - extract only necessary data
    if (project.mentors && Array.isArray(project.mentors) && project.mentors.length > 0) {
      project.mentors = project.mentors.map((pm: any) => ({
        id: pm.id,
        status: pm.status,
        expertiseAreas: pm.expertiseAreas || null,
        joinedAt: pm.joinedAt,
        leftAt: pm.leftAt || null,
        user: pm.user ? this.formatUserData(pm.user) : null,
      }));
    } else {
      project.mentors = null;
    }

    // Format skills - extract only skill data
    if (project.skills && Array.isArray(project.skills) && project.skills.length > 0) {
      project.skills = project.skills
        .map((ps: any) => ps.skill ? {
          id: ps.skill.id,
          name: ps.skill.name,
          icon: ps.skill.icon || null,
          isMandatory: ps.isMandatory || false,
        } : null)
        .filter((skill: any) => skill !== null);
    } else {
      project.skills = null;
    }

    // Format categories - extract only category data
    if (project.categories && Array.isArray(project.categories) && project.categories.length > 0) {
      project.categories = project.categories
        .map((pc: any) => pc.category ? {
          id: pc.category.id,
          name: pc.category.name,
          icon: pc.category.icon || null,
          description: pc.category.description || null,
        } : null)
        .filter((category: any) => category !== null);
    } else {
      project.categories = null;
    }

    return project;
  }
}
