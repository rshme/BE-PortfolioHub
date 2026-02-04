import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Project } from './entities/project.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { ProjectVolunteer } from './entities/project-volunteer.entity';
import { ProjectMentor } from './entities/project-mentor.entity';
import { UserSkill } from '../users/entities/user-skill.entity';
import { UserInterest } from '../users/entities/user-interest.entity';
import { JaccardSimilarity } from '../../common/utils/jaccard-similarity.util';
import {
  SimilarityScore,
  ProjectRecommendation,
} from './interfaces/similarity.interface';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class SimilarityService {
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'project_recommendations';

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectSkill)
    private readonly projectSkillRepository: Repository<ProjectSkill>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepository: Repository<UserSkill>,
    @InjectRepository(UserInterest)
    private readonly userInterestRepository: Repository<UserInterest>,
    @InjectRepository(ProjectVolunteer)
    private readonly projectVolunteerRepository: Repository<ProjectVolunteer>,
    @InjectRepository(ProjectMentor)
    private readonly projectMentorRepository: Repository<ProjectMentor>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Calculate Jaccard similarity between user skills and project skills
   */
  async calculateSimilarity(
    userId: string,
    projectId: string,
  ): Promise<SimilarityScore> {
    const startTime = Date.now();

    // Get user skills
    const userSkills = await this.userSkillRepository.find({
      where: { userId },
      relations: ['skill'],
    });

    if (userSkills.length === 0) {
      throw new NotFoundException('User has no skills registered');
    }

    // Get project skills
    const projectSkills = await this.projectSkillRepository.find({
      where: { projectId },
      relations: ['skill', 'project'],
    });

    if (projectSkills.length === 0) {
      throw new NotFoundException('Project has no skills registered');
    }

    // Extract skill IDs and names
    const userSkillIds = userSkills.map((us) => us.skillId);
    const userSkillNames = userSkills.map((us) => us.skill?.name || us.skillId);
    const projectSkillIds = projectSkills.map((ps) => ps.skillId);
    const projectSkillNames = projectSkills.map((ps) => ps.skill?.name || ps.skillId);

    // Calculate Jaccard similarity
    const similarityScore = JaccardSimilarity.calculate(
      userSkillIds,
      projectSkillIds,
    );

    // Get matching skills
    const matchingSkillIds = JaccardSimilarity.getCommonItems(
      userSkillIds,
      projectSkillIds,
    );

    const matchingSkills = projectSkills
      .filter((ps) => matchingSkillIds.includes(ps.skillId))
      .map((ps) => ps.skill?.name || ps.skillId);

    const project = projectSkills[0].project;
    const calculationTime = Date.now() - startTime;

    // Log Jaccard similarity calculation
    this.loggingService.logJaccardCalculation({
      projectId,
      projectName: project?.name || 'Unknown',
      projectSkills: projectSkillNames,
      projectCategories: [], // Will be added if needed
      userSkills: userSkillNames,
      userInterests: [],
      skillsSimilarity: similarityScore,
      categoriesSimilarity: 0,
      overallScore: similarityScore,
      calculationTimeMs: calculationTime,
    });

    return {
      projectId,
      projectName: project?.name || 'Unknown',
      similarityScore,
      similarityPercentage: Math.round(similarityScore * 100),
      matchingSkillsCount: matchingSkillIds.length,
      totalProjectSkills: projectSkillIds.length,
      matchingSkills,
    };
  }

  /**
   * Batch calculate similarity scores for all eligible projects for a user
   */
  async batchCalculateSimilarity(
    userId: string,
    excludeProjectIds: string[] = [],
  ): Promise<SimilarityScore[]> {
    // Get user skills
    const userSkills = await this.userSkillRepository.find({
      where: { userId },
    });

    if (userSkills.length === 0) {
      return [];
    }

    const userSkillIds = userSkills.map((us) => us.skillId);

    // Get all active projects with skills (excluding user's projects)
    let projectsQuery = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.skills', 'projectSkills')
      .leftJoinAndSelect('projectSkills.skill', 'skill')
      .where('project.status IN (:...statuses)', {
        statuses: [ProjectStatus.ACTIVE, ProjectStatus.IN_PROGRESS],
      });

    if (excludeProjectIds.length > 0) {
      projectsQuery = projectsQuery.andWhere(
        'project.id NOT IN (:...excludeIds)',
        {
          excludeIds: excludeProjectIds,
        },
      );
    }

    const projects = await projectsQuery.getMany();

    // Calculate similarity for each project
    const similarities: SimilarityScore[] = [];

    for (const project of projects) {
      if (!project.skills || project.skills.length === 0) {
        continue; // Skip projects without skills
      }

      const projectSkillIds = project.skills.map((ps: any) => ps.skillId);

      const similarityScore = JaccardSimilarity.calculate(
        userSkillIds,
        projectSkillIds,
      );

      // Only include projects with some similarity
      if (similarityScore > 0) {
        const matchingSkillIds = JaccardSimilarity.getCommonItems(
          userSkillIds,
          projectSkillIds,
        );

        const matchingSkills = project.skills
          .filter((ps: any) => matchingSkillIds.includes(ps.skillId))
          .map((ps: any) => ps.skill?.name || ps.skillId);

        similarities.push({
          projectId: project.id,
          projectName: project.name,
          similarityScore,
          similarityPercentage: Math.round(similarityScore * 100),
          matchingSkillsCount: matchingSkillIds.length,
          totalProjectSkills: projectSkillIds.length,
          matchingSkills,
        });
      }
    }

    // Sort by similarity score (descending)
    return similarities.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Get project recommendations for a user with caching
   */
  async getRecommendations(
    userId: string,
    limit: number = 10,
    minSimilarity: number = 0,
  ): Promise<ProjectRecommendation[]> {
    const searchStartTime = Date.now();

    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}:${userId}:${limit}:${minSimilarity}`;
    const cached =
      await this.cacheManager.get<ProjectRecommendation[]>(cacheKey);

    if (cached) {
      const searchEndTime = Date.now();
      
      // Log cached result metrics
      this.loggingService.log(
        `Project recommendations retrieved from cache for user ${userId}`,
        'SimilarityService',
        {
          userId,
          cached: true,
          resultCount: cached.length,
          durationMs: searchEndTime - searchStartTime,
        },
      );

      return cached;
    }

    // Get user skills and interests for logging
    const [userSkills, userInterests] = await Promise.all([
      this.userSkillRepository.find({
        where: { userId },
        relations: ['skill'],
      }),
      this.userInterestRepository.find({
        where: { userId },
        relations: ['category'],
      }),
    ]);

    const userSkillNames = userSkills.map((us) => us.skill?.name || us.skillId);
    const userInterestNames = userInterests.map(
      (ui) => ui.category?.name || ui.categoryId,
    );

    // Get projects user is already part of (to exclude)
    const [volunteerProjects, mentorProjects, createdProjects] =
      await Promise.all([
        this.projectVolunteerRepository.find({
          where: { userId },
          select: ['projectId'],
        }),
        this.projectMentorRepository.find({
          where: { userId },
          select: ['projectId'],
        }),
        this.projectRepository.find({
          where: { creatorId: userId },
          select: ['id'],
        }),
      ]);

    const excludeProjectIds = [
      ...volunteerProjects.map((pv) => pv.projectId),
      ...mentorProjects.map((pm) => pm.projectId),
      ...createdProjects.map((p) => p.id),
    ];

    // Calculate similarities
    const similarities = await this.batchCalculateSimilarity(
      userId,
      excludeProjectIds,
    );

    // Filter by minimum similarity
    const filtered = similarities.filter(
      (s) => s.similarityPercentage >= minSimilarity,
    );

    // Get top N recommendations
    const topSimilarities = filtered.slice(0, limit);

    // Fetch full project details
    if (topSimilarities.length === 0) {
      const searchEndTime = Date.now();
      
      // Log empty result
      this.loggingService.logProjectMatchingMetrics({
        userId,
        userSkills: userSkillNames,
        userInterests: userInterestNames,
        searchStartTime,
        searchEndTime,
        totalProjects: similarities.length,
        matchedProjects: [],
      });

      return [];
    }

    const projectIds = topSimilarities.map((s) => s.projectId);
    const projects = await this.projectRepository.find({
      where: { id: In(projectIds) },
      relations: [
        'creator',
        'volunteers',
        'volunteers.user',
        'mentors',
        'mentors.user',
        'skills',
        'skills.skill',
        'categories',
        'categories.category',
      ],
    });

    // Combine similarity scores with project details
    const recommendations: ProjectRecommendation[] = topSimilarities.map(
      (similarity) => {
        const project = projects.find((p) => p.id === similarity.projectId);
        return {
          ...similarity,
          project: project ? this.formatProjectResponse(project) : project,
        };
      },
    );

    // Cache the results
    await this.cacheManager.set(cacheKey, recommendations, this.CACHE_TTL);

    const searchEndTime = Date.now();

    // Prepare matched projects data for logging
    const matchedProjectsData = topSimilarities.map((sim) => ({
      projectId: sim.projectId,
      projectName: sim.projectName,
      jaccardScore: sim.similarityScore,
      matchedSkills: sim.matchingSkills,
      matchedCategories: [], // Can be enhanced later
    }));

    // Calculate average and top match scores
    const topMatchScore =
      matchedProjectsData.length > 0 ? matchedProjectsData[0].jaccardScore : 0;
    const avgMatchScore =
      matchedProjectsData.length > 0
        ? matchedProjectsData.reduce((sum, p) => sum + p.jaccardScore, 0) /
          matchedProjectsData.length
        : 0;

    // Log project matching metrics untuk hipotesis
    this.loggingService.logProjectMatchingMetrics({
      userId,
      userSkills: userSkillNames,
      userInterests: userInterestNames,
      searchStartTime,
      searchEndTime,
      totalProjects: similarities.length,
      matchedProjects: matchedProjectsData,
      topMatchScore,
      avgMatchScore,
    });

    return recommendations;
  }

  /**
   * Helper method to format project response without sensitive data
   */
  private formatProjectResponse(project: any): any {
    // Format creator
    if (project.creator) {
      const { password, role, email, ...safeCreatorData } = project.creator;
      project.creator = safeCreatorData;
    }

    // Format volunteers - extract only ACTIVE volunteers
    if (
      project.volunteers &&
      Array.isArray(project.volunteers) &&
      project.volunteers.length > 0
    ) {
      const activeVolunteers = project.volunteers.filter(
        (v: any) => v.status === VolunteerStatus.ACTIVE,
      );
      
      if (activeVolunteers.length > 0) {
        project.volunteers = activeVolunteers.map((v: any) => {
          const volunteer: any = {
            id: v.id,
            status: v.status,
            contributionScore: v.contributionScore || 0,
            tasksCompleted: v.tasksCompleted || 0,
            joinedAt: v.joinedAt,
            leftAt: v.leftAt,
          };

          if (v.user) {
            const { password, role, email, ...safeUserData } = v.user;
            volunteer.user = safeUserData;
          }

          return volunteer;
        });
      } else {
        project.volunteers = null;
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
      const activeMentors = project.mentors.filter(
        (m: any) => m.status === MentorStatus.ACTIVE,
      );
      
      if (activeMentors.length > 0) {
        project.mentors = activeMentors.map((m: any) => {
          const mentor: any = {
            id: m.id,
            status: m.status,
            expertiseAreas: m.expertiseAreas,
            joinedAt: m.joinedAt,
            leftAt: m.leftAt,
          };

          if (m.user) {
            const { password, role, email, ...safeUserData } = m.user;
            mentor.user = safeUserData;
          }

          return mentor;
        });
      } else {
        project.mentors = null;
      }
    } else {
      project.mentors = null;
    }

    // Format skills - extract only skill data
    if (
      project.skills &&
      Array.isArray(project.skills) &&
      project.skills.length > 0
    ) {
      project.skills = project.skills.map((ps: any) => ({
        id: ps.skill?.id || ps.skillId,
        name: ps.skill?.name,
        icon: ps.skill?.icon,
        isMandatory: ps.isMandatory,
      }));
    } else {
      project.skills = null;
    }

    // Format categories - extract only category data
    if (
      project.categories &&
      Array.isArray(project.categories) &&
      project.categories.length > 0
    ) {
      project.categories = project.categories.map((pc: any) => ({
        id: pc.category?.id || pc.categoryId,
        name: pc.category?.name,
        icon: pc.category?.icon,
        description: pc.category?.description,
      }));
    } else {
      project.categories = null;
    }

    // Add volunteer count
    project.volunteerCount = project.volunteers && Array.isArray(project.volunteers) 
      ? project.volunteers.length 
      : 0;

    return project;
  }

  /**
   * Invalidate cache for a specific user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    // Since cache-manager doesn't have a pattern-based deletion,
    // we'll need to track keys or use Redis directly for pattern deletion
    // For now, we'll just note that cache will expire naturally
    const cacheKey = `${this.CACHE_PREFIX}:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Get similarity statistics for a user
   */
  async getSimilarityStats(userId: string) {
    const userSkills = await this.userSkillRepository.find({
      where: { userId },
      relations: ['skill'],
    });

    const similarities = await this.batchCalculateSimilarity(userId);

    return {
      userSkillsCount: userSkills.length,
      totalEligibleProjects: similarities.length,
      averageSimilarity:
        similarities.length > 0
          ? similarities.reduce((sum, s) => sum + s.similarityScore, 0) /
            similarities.length
          : 0,
      topMatch: similarities[0] || null,
    };
  }
}
