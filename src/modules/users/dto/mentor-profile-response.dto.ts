import { Expose, Type } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ProjectStatus } from '../../../common/enums/project-status.enum';

export class MentorSkillDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class MentorInterestDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class MentorAchievementDto {
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

export class MentorReviewerDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  fullName: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  role: UserRole;
}

export class MentorReviewDto {
  @Expose()
  id: string;

  @Expose()
  rating: number;

  @Expose()
  content: string;

  @Expose()
  @Type(() => MentorReviewerDto)
  reviewer: MentorReviewerDto;

  @Expose()
  createdAt: Date;
}

export class MentoredProjectDto {
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
  volunteersGuided: number;

  @Expose()
  tasksCreated: number;

  @Expose()
  joinedAsmentorAt: Date;

  @Expose()
  volunteersNeeded: number;
}

export class MentorStatsDto {
  @Expose()
  projectsMentored: number;

  @Expose()
  totalTasksCreated: number;

  @Expose()
  rating: number;

  @Expose()
  totalReviews: number;

  @Expose()
  activeSince: Date;
}

export class MentorOrganizationDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  logoUrl?: string;

  @Expose()
  website?: string;
}

export class MentorProfileResponseDto {
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

  // === Professional Info ===
  @Expose()
  @Type(() => MentorOrganizationDto)
  organization?: MentorOrganizationDto;

  // === Skills ===
  @Expose()
  @Type(() => MentorSkillDto)
  skills: MentorSkillDto[];

  // === Interests ===
  @Expose()
  @Type(() => MentorInterestDto)
  interests: MentorInterestDto[];

  // === Social Links ===
  @Expose()
  socialLinks: Record<string, string>;

  // === User badges ===
  @Expose()
  @Type(() => MentorAchievementDto)
  achievements: MentorAchievementDto[];

  // === Mentor-Specific Stats ===
  @Expose()
  @Type(() => MentorStatsDto)
  stats: MentorStatsDto;

  // === Mentored Projects ===
  @Expose()
  @Type(() => MentoredProjectDto)
  mentoredProjects: MentoredProjectDto[];

  // === Testimonials ===
  @Expose()
  @Type(() => MentorReviewDto)
  reviews: MentorReviewDto[];
}
