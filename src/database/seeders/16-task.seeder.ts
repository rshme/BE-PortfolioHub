import { DataSource } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { Milestone } from '../../modules/milestones/entities/milestone.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ProjectVolunteer } from '../../modules/projects/entities/project-volunteer.entity';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';

export class TaskSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const taskRepository = dataSource.getRepository(Task);
    const projectRepository = dataSource.getRepository(Project);
    const milestoneRepository = dataSource.getRepository(Milestone);
    const projectVolunteerRepository =
      dataSource.getRepository(ProjectVolunteer);

    // Check if data already exists
    const count = await taskRepository.count();
    if (count > 0) {
      console.log('✅ Tasks already seeded, skipping...');
      return;
    }

    // Get active and planning projects with their milestones
    const projects = await projectRepository.find({
      where: [
        { status: ProjectStatus.ACTIVE },
        { status: ProjectStatus.IN_PROGRESS },
      ],
    });

    if (projects.length === 0) {
      console.log('⚠️ No active/planning projects found, skipping tasks seeding');
      return;
    }

    const tasks: Array<{
      projectId: string;
      milestoneId?: string;
      assignedToId?: string;
      createdById: string;
      title: string;
      description: string;
      priority: TaskPriority;
      status: TaskStatus;
      dueDate?: Date;
      tags: string[];
      completedAt?: Date;
    }> = [];

    // Create tasks for each project
    for (const project of projects) {
      // Get milestones for this project
      const milestones = await milestoneRepository.find({
        where: { projectId: project.id },
        order: { orderPosition: 'ASC' },
      });

      // Get volunteers for this project
      const volunteers = await projectVolunteerRepository.find({
        where: { projectId: project.id, status: VolunteerStatus.APPROVED },
      });

      const taskTemplates = [
        {
          title: 'Setup project repository',
          description: 'Initialize Git repository and setup basic project structure',
          priority: TaskPriority.HIGH,
          tags: ['setup', 'git'],
        },
        {
          title: 'Create database schema',
          description: 'Design and implement database schema with all required tables',
          priority: TaskPriority.HIGH,
          tags: ['database', 'schema'],
        },
        {
          title: 'Implement user authentication',
          description: 'Setup user registration, login, and authentication system',
          priority: TaskPriority.HIGH,
          tags: ['authentication', 'security'],
        },
        {
          title: 'Design UI mockups',
          description: 'Create wireframes and mockups for main user interfaces',
          priority: TaskPriority.MEDIUM,
          tags: ['design', 'ui'],
        },
        {
          title: 'Setup CI/CD pipeline',
          description: 'Configure automated testing and deployment pipeline',
          priority: TaskPriority.MEDIUM,
          tags: ['devops', 'ci-cd'],
        },
        {
          title: 'Write API documentation',
          description: 'Document all API endpoints with examples',
          priority: TaskPriority.MEDIUM,
          tags: ['documentation', 'api'],
        },
        {
          title: 'Implement search functionality',
          description: 'Add search feature with filters and pagination',
          priority: TaskPriority.MEDIUM,
          tags: ['feature', 'search'],
        },
        {
          title: 'Add unit tests',
          description: 'Write unit tests for core functionality',
          priority: TaskPriority.HIGH,
          tags: ['testing', 'unit-tests'],
        },
        {
          title: 'Optimize database queries',
          description: 'Review and optimize slow database queries',
          priority: TaskPriority.LOW,
          tags: ['optimization', 'database'],
        },
        {
          title: 'Fix responsive design issues',
          description: 'Ensure UI works properly on mobile devices',
          priority: TaskPriority.MEDIUM,
          tags: ['bug', 'responsive'],
        },
        {
          title: 'Setup monitoring and logging',
          description: 'Implement application monitoring and error logging',
          priority: TaskPriority.MEDIUM,
          tags: ['monitoring', 'logging'],
        },
        {
          title: 'Create user guide',
          description: 'Write comprehensive user documentation and tutorials',
          priority: TaskPriority.LOW,
          tags: ['documentation', 'user-guide'],
        },
        {
          title: 'Implement email notifications',
          description: 'Setup email notification system for important events',
          priority: TaskPriority.LOW,
          tags: ['feature', 'notifications'],
        },
        {
          title: 'Security audit',
          description: 'Conduct security review and fix vulnerabilities',
          priority: TaskPriority.HIGH,
          tags: ['security', 'audit'],
        },
        {
          title: 'Performance testing',
          description: 'Run load tests and optimize performance bottlenecks',
          priority: TaskPriority.MEDIUM,
          tags: ['testing', 'performance'],
        },
      ];

      // Create 8-15 tasks per project
      const taskCount = Math.floor(Math.random() * 8) + 8; // 8 to 15 tasks
      const shuffled = [...taskTemplates].sort(() => 0.5 - Math.random());
      const selectedTasks = shuffled.slice(0, Math.min(taskCount, taskTemplates.length));

      for (let i = 0; i < selectedTasks.length; i++) {
        const template = selectedTasks[i];
        
        // Assign milestone (distribute tasks across milestones)
        const milestoneIndex = Math.floor(i / (selectedTasks.length / Math.max(milestones.length, 1)));
        const milestone = milestones[Math.min(milestoneIndex, milestones.length - 1)];

        // Determine task status
        let status: TaskStatus;
        let completedAt: Date | undefined;
        const rand = Math.random();
        
        if (rand > 0.7) {
          status = TaskStatus.TODO;
        } else if (rand > 0.5) {
          status = TaskStatus.IN_PROGRESS;
        } else if (rand > 0.3) {
          status = TaskStatus.IN_REVIEW;
        } else {
          status = TaskStatus.COMPLETED;
          completedAt = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
        }

        // Assign to volunteer or leave unassigned
        let assignedToId: string | undefined;
        if (volunteers.length > 0 && Math.random() > 0.3) {
          const randomVolunteer = volunteers[Math.floor(Math.random() * volunteers.length)];
          assignedToId = randomVolunteer.userId;
        }

        // Calculate due date
        let dueDate: Date | undefined;
        if (milestone?.endDate) {
          dueDate = new Date(milestone.endDate);
        } else if (project.endDate) {
          dueDate = new Date(project.endDate);
        }

        tasks.push({
          projectId: project.id,
          milestoneId: milestone?.id,
          assignedToId,
          createdById: project.creatorId,
          title: template.title,
          description: template.description,
          priority: template.priority,
          status,
          dueDate,
          tags: template.tags,
          completedAt,
        });
      }
    }

    await taskRepository.save(tasks);
    console.log(`✅ Seeded ${tasks.length} tasks`);
  }
}
