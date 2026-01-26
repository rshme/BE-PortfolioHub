import { DataSource } from 'typeorm';
import { Milestone } from '../../modules/milestones/entities/milestone.entity';
import { MilestoneStatus } from '../../common/enums/milestone-status.enum';

export const seedMilestones = async (dataSource: DataSource) => {
  const milestoneRepository = dataSource.getRepository(Milestone);

  // Get all projects
  const projects = await dataSource.query('SELECT id FROM projects LIMIT 10');

  if (projects.length === 0) {
    console.log('⚠️  No projects found. Skipping milestone seeding.');
    return;
  }

  const milestonesToSeed: Partial<Milestone>[] = [];

  // Create milestones for each project
  for (const project of projects) {
    // Phase 1 - Foundation
    milestonesToSeed.push({
      projectId: project.id,
      name: 'Phase 1 - Foundation',
      description: 'Initial project setup, architecture design, and foundation work',
      status: MilestoneStatus.COMPLETED,
      orderPosition: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-28'),
      tags: ['setup', 'foundation', 'architecture'],
    });

    // Phase 2 - Core Development
    milestonesToSeed.push({
      projectId: project.id,
      name: 'Phase 2 - Core Development',
      description: 'Development of core features and functionality',
      status: MilestoneStatus.IN_PROGRESS,
      orderPosition: 1,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31'),
      tags: ['development', 'features', 'backend'],
    });

    // Phase 3 - Testing & QA
    milestonesToSeed.push({
      projectId: project.id,
      name: 'Phase 3 - Testing & QA',
      description: 'Comprehensive testing, bug fixes, and quality assurance',
      status: MilestoneStatus.NOT_STARTED,
      orderPosition: 2,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-07-15'),
      tags: ['testing', 'qa', 'bugfix'],
    });

    // Phase 4 - Deployment
    milestonesToSeed.push({
      projectId: project.id,
      name: 'Phase 4 - Deployment & Launch',
      description: 'Final deployment preparations and production launch',
      status: MilestoneStatus.NOT_STARTED,
      orderPosition: 3,
      startDate: new Date('2024-07-16'),
      endDate: new Date('2024-08-31'),
      tags: ['deployment', 'production', 'launch'],
    });
  }

  // Check existing milestones to avoid duplicates
  const existingCount = await milestoneRepository.count();

  if (existingCount > 0) {
    console.log(`ℹ️  Found ${existingCount} existing milestones. Clearing for fresh seed...`);
    await milestoneRepository.clear();
  }

  // Insert milestones
  const savedMilestones = await milestoneRepository.save(milestonesToSeed);

  console.log(`✅ Seeded ${savedMilestones.length} milestones across ${projects.length} projects`);
  console.log(`   - ${savedMilestones.filter(m => m.status === MilestoneStatus.COMPLETED).length} completed`);
  console.log(`   - ${savedMilestones.filter(m => m.status === MilestoneStatus.IN_PROGRESS).length} in progress`);
  console.log(`   - ${savedMilestones.filter(m => m.status === MilestoneStatus.NOT_STARTED).length} not started`);
};
