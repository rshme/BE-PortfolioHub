import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { ProjectLevel } from '../../common/enums/project-level.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export class ProjectSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectRepository = dataSource.getRepository(Project);
    const userRepository = dataSource.getRepository(User);

    // Check if data already exists
    const count = await projectRepository.count();
    if (count > 0) {
      console.log('✅ Projects already seeded, skipping...');
      return;
    }

    // Get project creators and verifier (admin)
    const creators = await userRepository.find({
      where: { role: UserRole.PROJECT_OWNER },
    });
    const admin = await userRepository.findOne({
      where: { email: 'admin@portfoliohub.com' },
    });

    if (creators.length === 0) {
      console.log('⚠️ No project creators found, skipping projects seeding');
      return;
    }

    const projectTemplates = [
      {
        name: 'Community Learning Platform',
        description:
          'An open-source e-learning platform connecting students with quality educational resources and mentors worldwide.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 5,
        links: {
          github: 'https://github.com/community-learning',
          demo: 'https://community-learning.demo.com',
        },
        isVerified: true,
      },
      {
        name: 'Green Energy Monitor',
        description:
          'IoT-based system for monitoring and optimizing renewable energy usage in residential areas.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 3,
        links: {
          github: 'https://github.com/green-energy-monitor',
        },
        isVerified: true,
      },
      {
        name: 'Healthcare Access App',
        description:
          'Mobile application helping underserved communities find and access nearby healthcare facilities and services.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 4,
        links: {
          github: 'https://github.com/healthcare-access',
          website: 'https://healthaccess.app',
        },
        isVerified: true,
      },
      {
        name: 'Food Waste Tracker',
        description:
          'Web app connecting restaurants with surplus food to local food banks and charities.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: {
          github: 'https://github.com/food-waste-tracker',
        },
        isVerified: false,
      },
      {
        name: 'Open Source Documentation Hub',
        description:
          'Collaborative platform for creating and maintaining high-quality documentation for open-source projects.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 4,
        links: {
          github: 'https://github.com/os-docs-hub',
        },
        isVerified: false,
      },
      {
        name: 'Climate Data Visualization',
        description:
          'Interactive dashboard visualizing climate change data and trends to raise public awareness.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 2,
        links: {
          github: 'https://github.com/climate-data-viz',
          demo: 'https://climate-data.demo.com',
        },
        isVerified: true,
      },
      {
        name: 'Volunteer Management System',
        description:
          'Comprehensive system for NGOs to manage volunteers, track hours, and coordinate community projects.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 5,
        links: {
          github: 'https://github.com/volunteer-mgmt',
        },
        isVerified: true,
      },
      {
        name: 'Mental Health Support Chat',
        description:
          'Anonymous chat platform connecting individuals with trained mental health support volunteers.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 3,
        links: {
          github: 'https://github.com/mental-health-chat',
        },
        isVerified: false,
      },
      {
        name: 'Local Business Directory',
        description:
          'Community-driven directory helping people discover and support local small businesses.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 4,
        links: {
          github: 'https://github.com/local-biz-directory',
          website: 'https://localbiz.directory',
        },
        isVerified: true,
      },
      {
        name: 'Code Review Buddy',
        description:
          'AI-assisted code review tool helping developers learn best practices and improve code quality.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 2,
        links: {
          github: 'https://github.com/code-review-buddy',
        },
        isVerified: false,
      },
    ];

    const projects: Array<{
      creatorId: string;
      name: string;
      description: string;
      status: ProjectStatus;
      level: ProjectLevel;
      volunteersNeeded: number;
      volunteerCount: number;
      startDate?: Date;
      endDate?: Date;
      links: Record<string, string | undefined>;
      images: string[];
      bannerUrl?: string;
      isVerified: boolean;
      verifiedBy?: string;
    }> = [];

    // Create 2-3 projects per creator
    for (const creator of creators) {
      const projectCount = Math.floor(Math.random() * 2) + 2; // 2-3 projects per creator
      const shuffledTemplates = [...projectTemplates].sort(() => 0.5 - Math.random());
      const selectedTemplates = shuffledTemplates.slice(0, projectCount);

      for (const template of selectedTemplates) {
        const startDate = template.status !== ProjectStatus.DRAFT
          ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) // Random date in last 6 months
          : undefined;
        
        const endDate = startDate && template.status !== ProjectStatus.COMPLETED
          ? new Date(startDate.getTime() + (Math.random() * 180 + 90) * 24 * 60 * 60 * 1000) // 3-9 months from start
          : startDate
          ? new Date(startDate.getTime() + Math.random() * 120 * 24 * 60 * 60 * 1000) // completed within 4 months
          : undefined;

        const imageCount = Math.floor(Math.random() * 3); // 0-2 images
        const images = Array.from({ length: imageCount }, (_, i) => 
          `https://picsum.photos/800/600?random=${Math.random()}`
        );

        projects.push({
          creatorId: creator.id,
          name: template.name,
          description: template.description,
          status: template.status,
          level: template.level,
          volunteersNeeded: template.volunteersNeeded,
          volunteerCount: 0,
          startDate,
          endDate,
          links: template.links,
          images,
          bannerUrl: Math.random() > 0.3 ? `https://picsum.photos/1200/400?random=${Math.random()}` : undefined,
          isVerified: template.isVerified,
          verifiedBy: template.isVerified ? admin?.id : undefined,
        });
      }
    }

    await projectRepository.save(projects);
    console.log(`✅ Seeded ${projects.length} projects`);
  }
}
