import { Expose, Type } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ProjectStatus } from '../../../common/enums/project-status.enum';

export class SkillDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class InterestDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class AchievementDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  iconUrl?: string;

  @Expose()
  rarity: string;

  @Expose()
  awardedAt: Date;
}

export class ProjectContributionDto {
  @Expose()
  projectId: string;

  @Expose()
  projectName: string;

  @Expose()
  projectDescription: string;

  @Expose()
  projectStatus: ProjectStatus;

  @Expose()
  projectTags: string[];

  @Expose()
  contributionScore: number;

  @Expose()
  joinedAt: Date;

  @Expose()
  tasksCompleted: number;

  @Expose()
  tasksTotal: number;
}

export class VolunteerStatsDto {
  @Expose()
  totalProjects: number;

  @Expose()
  totalContributions: number;

  @Expose()
  totalTasksCompleted: number;

  @Expose()
  averageScore: number;

  @Expose()
  rank: string;

  @Expose()
  activeSince: Date;
}

export class VolunteerProfileResponseDto {
  // === Basic Info ===
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  fullName: string;

  @Expose()
  role: UserRole;

  @Expose()
  avatarUrl?: string;

  @Expose()
  bio?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  organizationId?: string;

  @Expose()
  organization?: any;

  // === Skills ===
  @Expose()
  @Type(() => SkillDto)
  skills: SkillDto[];

  // === Interests ===
  @Expose()
  @Type(() => InterestDto)
  interests: InterestDto[];

  // === Achievements (User badges) ===
  @Expose()
  @Type(() => AchievementDto)
  achievements: AchievementDto[];

  // === Social Links ===
  @Expose()
  socialLinks?: Record<string, string>;

  // === Testimonials ===
  @Expose()
  testimonials?: any[];

  // === Volunteer Statistics ===
  @Expose()
  @Type(() => VolunteerStatsDto)
  stats: VolunteerStatsDto;

  // === Project Contributions ===
  @Expose()
  @Type(() => ProjectContributionDto)
  projectContributions: ProjectContributionDto[];

  // === Active Projects ===
  @Expose()
  @Type(() => ProjectContributionDto)
  activeProjects: ProjectContributionDto[];
}
