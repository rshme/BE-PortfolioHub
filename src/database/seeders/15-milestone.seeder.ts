import { DataSource } from 'typeorm';
import { Milestone } from '../../modules/milestones/entities/milestone.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { MilestoneStatus } from '../../common/enums/milestone-status.enum';
import { ProjectStatus } from '../../common/enums/project-status.enum';

export class MilestoneSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const milestoneRepository = dataSource.getRepository(Milestone);
    const projectRepository = dataSource.getRepository(Project);

    // Check if data already exists
    const count = await milestoneRepository.count();
    if (count > 0) {
      console.log('✅ Milestones already seeded, skipping...');
      return;
    }

    // Get active and planning projects
    const projects = await projectRepository.find({
      where: [
        { status: ProjectStatus.ACTIVE },
        { status: ProjectStatus.IN_PROGRESS },
      ],
    });

    if (projects.length === 0) {
      console.log('⚠️ No active/planning projects found, skipping milestones seeding');
      return;
    }

    const milestones: Array<{
      projectId: string;
      name: string;
      description: string;
      status: MilestoneStatus;
      orderPosition: number;
      startDate?: Date;
      endDate?: Date;
      tags: string[];
    }> = [];

    // Create 3-5 milestones for each project
    for (const project of projects) {
      const milestoneCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 milestones
      
      const milestoneTemplates = [
        {
          name: 'Project Setup & Planning',
          description: 'Initial project setup, repository creation, and planning phase',
          tags: ['setup', 'planning'],
        },
        {
          name: 'Requirements & Design',
          description: 'Gathering requirements and creating design documents',
          tags: ['requirements', 'design'],
        },
        {
          name: 'Core Development',
          description: 'Implementing core features and functionality',
          tags: ['development', 'core'],
        },
        {
          name: 'Testing & QA',
          description: 'Testing features, fixing bugs, and quality assurance',
          tags: ['testing', 'qa'],
        },
        {
          name: 'Documentation',
          description: 'Creating user and developer documentation',
          tags: ['documentation'],
        },
        {
          name: 'Deployment & Launch',
          description: 'Final deployment and project launch',
          tags: ['deployment', 'launch'],
        },
        {
          name: 'Post-Launch Support',
          description: 'Monitoring, bug fixes, and user support',
          tags: ['support', 'maintenance'],
        },
      ];

      // Shuffle and select milestones
      const shuffled = [...milestoneTemplates].sort(() => 0.5 - Math.random());
      const selectedMilestones = shuffled.slice(0, milestoneCount);

      for (let i = 0; i < selectedMilestones.length; i++) {
        const template = selectedMilestones[i];
        
        // Determine status based on order
        let status: MilestoneStatus;
        if (i === 0) {
          status = MilestoneStatus.COMPLETED;
        } else if (i === 1) {
          status = MilestoneStatus.IN_PROGRESS;
        } else {
          status = MilestoneStatus.NOT_STARTED;
        }

        // Calculate dates based on project dates
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (project.startDate && project.endDate) {
          // Convert to Date objects in case they come from DB as strings
          const projectStartTime = new Date(project.startDate).getTime();
          const projectEndTime = new Date(project.endDate).getTime();
          const projectDuration = projectEndTime - projectStartTime;
          const milestoneDuration = projectDuration / milestoneCount;
          
          startDate = new Date(projectStartTime + (milestoneDuration * i));
          endDate = new Date(startDate.getTime() + milestoneDuration);
        }

        milestones.push({
          projectId: project.id,
          name: template.name,
          description: template.description,
          status,
          orderPosition: i,
          startDate,
          endDate,
          tags: template.tags,
        });
      }
    }

    await milestoneRepository.save(milestones);
    console.log(`✅ Seeded ${milestones.length} milestones`);
  }
}
