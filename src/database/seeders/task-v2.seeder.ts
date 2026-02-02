import { DataSource } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Milestone } from '../../modules/milestones/entities/milestone.entity';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { MilestoneStatus } from '../../common/enums/milestone-status.enum';

export const seedTasks = async (dataSource: DataSource): Promise<void> => {
  const taskRepository = dataSource.getRepository(Task);
  const projectRepository = dataSource.getRepository(Project);
  const userRepository = dataSource.getRepository(User);
  const milestoneRepository = dataSource.getRepository(Milestone);

  // Check if tasks already exist
  const existingCount = await taskRepository.count();
  if (existingCount > 0) {
    console.log('ℹ️  Tasks already exist. Clearing for fresh seed...');
    await taskRepository.clear();
  }

  const projects = await projectRepository.find({ 
    relations: ['creator'],
    take: 10 
  });
  
  if (projects.length === 0) {
    console.log('⚠️  No projects found. Please run project seeder first.');
    return;
  }

  const milestones = await milestoneRepository.find();
  if (milestones.length === 0) {
    console.log('⚠️  No milestones found. Please run milestone seeder first.');
    return;
  }

  const volunteers = await userRepository.find({
    where: { role: UserRole.VOLUNTEER },
    take: 10,
  });

  if (volunteers.length === 0) {
    console.log('⚠️  No volunteers found. Please run user seeder first.');
    return;
  }

  const taskTemplates = [
    // Phase 1 - Foundation tasks (COMPLETED)
    {
      title: 'Setup project structure and architecture',
      description: 'Initialize project with proper folder structure, dependencies, and configuration',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      tags: ['setup', 'architecture'],
    },
    {
      title: 'Design database schema',
      description: 'Create comprehensive database schema with all required tables and relationships',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      tags: ['database', 'design'],
    },
    {
      title: 'Setup CI/CD pipeline',
      description: 'Configure continuous integration and deployment workflows',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      tags: ['devops', 'automation'],
    },
    
    // Phase 2 - Core Development tasks (IN_PROGRESS)
    {
      title: 'Implement user authentication',
      description: 'Build secure authentication system with JWT and refresh tokens',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      tags: ['auth', 'security'],
    },
    {
      title: 'Create API endpoints for core features',
      description: 'Develop RESTful API endpoints for main application features',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      tags: ['api', 'backend'],
    },
    {
      title: 'Build responsive UI components',
      description: 'Develop reusable UI components with responsive design',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      tags: ['frontend', 'ui'],
    },
    {
      title: 'Implement data validation and sanitization',
      description: 'Add comprehensive input validation and data sanitization',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      tags: ['validation', 'security'],
    },
    {
      title: 'Setup logging and monitoring',
      description: 'Implement application logging and monitoring infrastructure',
      priority: TaskPriority.LOW,
      status: TaskStatus.TODO,
      tags: ['logging', 'monitoring'],
    },
    
    // Phase 3 - Testing tasks (NOT_STARTED)
    {
      title: 'Write unit tests',
      description: 'Create comprehensive unit tests for all modules',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      tags: ['testing', 'quality'],
    },
    {
      title: 'Perform integration testing',
      description: 'Test integration between different modules and services',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      tags: ['testing', 'integration'],
    },
  ];

  const allTasks: Partial<Task>[] = [];

  // Create tasks for each project
  for (const project of projects) {
    // Get milestones for this project
    const projectMilestones = milestones.filter(m => m.projectId === project.id);
    
    if (projectMilestones.length === 0) {
      console.log(`⚠️  No milestones found for project ${project.id}`);
      continue;
    }

    const phase1 = projectMilestones.find(m => m.status === MilestoneStatus.COMPLETED);
    const phase2 = projectMilestones.find(m => m.status === MilestoneStatus.IN_PROGRESS);
    const phase3 = projectMilestones.find(m => m.status === MilestoneStatus.NOT_STARTED);

    // Assign tasks to milestones
    taskTemplates.forEach((template, index) => {
      let milestone;
      let assignedTo: User | null = null;
      let completedAt: Date | null = null;

      // Assign to appropriate milestone based on status
      if (template.status === TaskStatus.COMPLETED && phase1) {
        milestone = phase1;
        assignedTo = volunteers[index % volunteers.length];
        completedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
      } else if (
        (template.status === TaskStatus.IN_PROGRESS || 
         (template.status === TaskStatus.TODO && index < 6)) && 
        phase2
      ) {
        milestone = phase2;
        // 70% chance to assign volunteer for in_progress milestone
        if (Math.random() > 0.3) {
          assignedTo = volunteers[index % volunteers.length];
        }
      } else if (phase3) {
        milestone = phase3;
        // 30% chance to assign volunteer for future milestone
        if (Math.random() > 0.7) {
          assignedTo = volunteers[index % volunteers.length];
        }
      }

      if (milestone) {
        allTasks.push({
          projectId: project.id,
          milestoneId: milestone.id,
          title: template.title,
          description: template.description,
          priority: template.priority,
          status: template.status,
          tags: template.tags,
          assignedToId: assignedTo?.id,
          createdById: project.creator.id,
          dueDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date in next 60 days
          completedAt: completedAt || undefined,
        });
      }
    });
  }

  // Save tasks
  if (allTasks.length > 0) {
    const savedTasks = await taskRepository.save(allTasks);
    
    console.log(`✅ Seeded ${savedTasks.length} tasks across ${projects.length} projects`);
    console.log(`   - ${savedTasks.filter(t => t.status === TaskStatus.COMPLETED).length} completed`);
    console.log(`   - ${savedTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length} in progress`);
    console.log(`   - ${savedTasks.filter(t => t.status === TaskStatus.TODO).length} todo`);
    console.log(`   - ${savedTasks.filter(t => t.assignedToId).length} assigned`);
  } else {
    console.log('⚠️  No tasks created. Check milestones setup.');
  }
};
