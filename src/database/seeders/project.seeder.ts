import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { ProjectLevel } from '../../common/enums/project-level.enum';

export const seedProjects = async (dataSource: DataSource): Promise<void> => {
  const projectRepository = dataSource.getRepository(Project);
  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);

  // Check if projects already exist
  const existingProjects = await projectRepository.count();
  if (existingProjects > 0) {
    console.log('Projects already exist, skipping seed...');
    return;
  }

  // Get users for project ownership
  const projectOwners = await userRepository.find({
    where: [
      { email: 'owner@portfoliohub.com' },
      { email: 'owner2@portfoliohub.com' },
    ],
  });

  if (projectOwners.length === 0) {
    console.log('⚠️  No project owners found. Please run user seeder first.');
    return;
  }

  // Get admin user for verification
  const adminUser = await userRepository.findOne({
    where: { email: 'admin@portfoliohub.com' },
  });

  // Get categories
  const webDevCategory = await categoryRepository.findOne({
    where: { name: 'Web Development' },
  });
  const mobileCategory = await categoryRepository.findOne({
    where: { name: 'Mobile Development' },
  });
  const dataCategory = await categoryRepository.findOne({
    where: { name: 'Data Science' },
  });
  const openSourceCategory = await categoryRepository.findOne({
    where: { name: 'Open Source' },
  });
  const socialImpactCategory = await categoryRepository.findOne({
    where: { name: 'Social Impact' },
  });

  const [owner1, owner2] = projectOwners;

  const projects = [
    {
      name: 'EduConnect - Online Learning Platform',
      description:
        'A comprehensive e-learning platform that connects students with quality educational resources and interactive courses. Features include live classes, assignments, progress tracking, and community forums.',
      creator: owner1,
      status: ProjectStatus.ACTIVE,
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-08-31'),
      isVerified: true,
      verifiedBy: adminUser?.id,
      links: {
        github: 'https://github.com/portfoliohub/educonnect',
        website: 'https://educonnect.demo',
      },
    },
    {
      name: 'GreenCart - Sustainable Shopping App',
      description:
        'Mobile marketplace connecting eco-conscious consumers with sustainable local businesses. Track your carbon footprint, earn rewards for green choices, and discover eco-friendly alternatives.',
      creator: owner2,
      status: ProjectStatus.IN_PROGRESS,
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-07-15'),
      isVerified: true,
      verifiedBy: adminUser?.id,
      links: {
        github: 'https://github.com/portfoliohub/greencart',
        figma: 'https://figma.com/greencart',
      },
    },
    {
      name: 'HealthTracker AI - Personal Health Assistant',
      description:
        'AI-powered health monitoring application that analyzes user health data, provides personalized recommendations, and predicts potential health risks using machine learning algorithms.',
      creator: owner1,
      status: ProjectStatus.IN_PROGRESS,
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 10,
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-12-31'),
      isVerified: false,
      links: {
        github: 'https://github.com/portfoliohub/healthtracker-ai',
        docs: 'https://docs.healthtracker.ai',
      },
    },
    {
      name: 'CodeCollab - Real-time Collaborative IDE',
      description:
        'Open-source web-based IDE for remote pair programming and collaborative coding. Features include real-time code sync, video chat, code review tools, and integrated version control.',
      creator: owner2,
      status: ProjectStatus.ACTIVE,
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 12,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-12-31'),
      isVerified: true,
      verifiedBy: adminUser?.id,
      links: {
        github: 'https://github.com/portfoliohub/codecollab',
        website: 'https://codecollab.io',
      },
    },
    {
      name: 'VolunteerHub - Community Service Platform',
      description:
        'Platform connecting volunteers with local non-profit organizations. Features include event management, volunteer matching, impact tracking, and community recognition system.',
      creator: owner1,
      status: ProjectStatus.DRAFT,
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-11-30'),
      isVerified: false,
      links: {
        github: 'https://github.com/portfoliohub/volunteerhub',
      },
    },
    {
      name: 'SmartFinance - Personal Budget Manager',
      description:
        'Intelligent personal finance application that helps users track expenses, create budgets, set financial goals, and get AI-powered savings recommendations.',
      creator: owner2,
      status: ProjectStatus.COMPLETED,
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-01-20'),
      isVerified: true,
      verifiedBy: adminUser?.id,
      links: {
        github: 'https://github.com/portfoliohub/smartfinance',
        website: 'https://smartfinance.app',
      },
    },
  ];

  for (const projectData of projects) {
    const project = projectRepository.create(projectData);
    await projectRepository.save(project);
    console.log(`✓ Created project: ${project.name}`);
  }

  console.log(`✅ Successfully seeded ${projects.length} projects`);
};
