import { DataSource } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export const seedTasks = async (dataSource: DataSource): Promise<void> => {
  const taskRepository = dataSource.getRepository(Task);
  const projectRepository = dataSource.getRepository(Project);
  const userRepository = dataSource.getRepository(User);

  // Check if tasks already exist
  const existingCount = await taskRepository.count();
  if (existingCount > 0) {
    console.log('Tasks already exist, skipping seed...');
    return;
  }

  const projects = await projectRepository.find({ relations: ['creator'] });
  if (projects.length === 0) {
    console.log('⚠️  No projects found. Please run project seeder first.');
    return;
  }

  const volunteers = await userRepository.find({
    where: { role: UserRole.VOLUNTEER },
  });

  if (volunteers.length === 0) {
    console.log('⚠️  No volunteers found. Please run user seeder first.');
    return;
  }

  const [alice, bob, charlie, eva, frank] = volunteers;

  // Tasks for EduConnect
  const eduConnect = projects.find(
    (p) => p.name === 'EduConnect - Online Learning Platform',
  );
  const eduConnectTasks = eduConnect
    ? [
        {
          project: eduConnect,
          title: 'Design database schema for user management',
          description:
            'Create comprehensive database schema including users, roles, authentication, and profile management tables.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          assignedTo: alice,
          createdBy: eduConnect.creator,
          dueDate: new Date('2026-01-25'),
        },
        {
          project: eduConnect,
          title: 'Implement user authentication with JWT',
          description:
            'Build secure authentication system using JWT tokens, including login, register, and password reset functionality.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          assignedTo: bob,
          createdBy: eduConnect.creator,
          dueDate: new Date('2026-01-28'),
        },
        {
          project: eduConnect,
          title: 'Create course listing and detail pages',
          description:
            'Develop responsive UI for browsing courses, including filters, search, and detailed course view.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          assignedTo: alice,
          createdBy: eduConnect.creator,
          dueDate: new Date('2026-02-05'),
        },
        {
          project: eduConnect,
          title: 'Implement video streaming functionality',
          description:
            'Integrate video player with adaptive streaming support for course videos.',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          assignedTo: bob,
          createdBy: eduConnect.creator,
          dueDate: new Date('2026-02-10'),
        },
        {
          project: eduConnect,
          title: 'Build assignment submission system',
          description:
            'Create interface for students to submit assignments with file upload support and grading workflow.',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assignedTo: null,
          createdBy: eduConnect.creator,
          dueDate: new Date('2026-02-15'),
        },
      ]
    : [];

  // Tasks for GreenCart
  const greenCart = projects.find(
    (p) => p.name === 'GreenCart - Sustainable Shopping App',
  );
  const greenCartTasks = greenCart
    ? [
        {
          project: greenCart,
          title: 'Design product catalog UI',
          description:
            'Create attractive and intuitive product browsing interface with eco-rating display.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          assignedTo: eva,
          createdBy: greenCart.creator,
          dueDate: new Date('2026-01-20'),
        },
        {
          project: greenCart,
          title: 'Implement shopping cart functionality',
          description:
            'Build shopping cart with add/remove items, quantity adjustment, and price calculation.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          assignedTo: frank,
          createdBy: greenCart.creator,
          dueDate: new Date('2026-01-22'),
        },
        {
          project: greenCart,
          title: 'Create carbon footprint calculator',
          description:
            'Develop algorithm to calculate and display carbon footprint for each product and order.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          assignedTo: frank,
          createdBy: greenCart.creator,
          dueDate: new Date('2026-01-30'),
        },
        {
          project: greenCart,
          title: 'Integrate payment gateway',
          description:
            'Implement secure payment processing with Stripe/PayPal integration.',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          assignedTo: eva,
          createdBy: greenCart.creator,
          dueDate: new Date('2026-02-08'),
        },
      ]
    : [];

  // Tasks for HealthTracker AI
  const healthTracker = projects.find(
    (p) => p.name === 'HealthTracker AI - Personal Health Assistant',
  );
  const healthTrackerTasks = healthTracker
    ? [
        {
          project: healthTracker,
          title: 'Collect and preprocess health datasets',
          description:
            'Gather health datasets and perform data cleaning, normalization, and feature engineering.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.URGENT,
          assignedTo: frank,
          createdBy: healthTracker.creator,
          dueDate: new Date('2026-01-15'),
        },
        {
          project: healthTracker,
          title: 'Train ML model for health prediction',
          description:
            'Develop and train machine learning models for predicting health risks based on user data.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.URGENT,
          assignedTo: frank,
          createdBy: healthTracker.creator,
          dueDate: new Date('2026-02-01'),
        },
        {
          project: healthTracker,
          title: 'Build health dashboard UI',
          description:
            'Create comprehensive dashboard showing health metrics, trends, and predictions.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          assignedTo: charlie,
          createdBy: healthTracker.creator,
          dueDate: new Date('2026-01-28'),
        },
        {
          project: healthTracker,
          title: 'Implement wearable device integration',
          description:
            'Connect with popular wearables (Fitbit, Apple Watch) to collect real-time health data.',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          assignedTo: null,
          createdBy: healthTracker.creator,
          dueDate: new Date('2026-02-15'),
        },
      ]
    : [];

  // Tasks for SmartFinance (Completed project)
  const smartFinance = projects.find(
    (p) => p.name === 'SmartFinance - Personal Budget Manager',
  );
  const smartFinanceTasks = smartFinance
    ? [
        {
          project: smartFinance,
          title: 'Design expense tracking interface',
          description:
            'Create intuitive UI for adding and categorizing expenses.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          assignedTo: eva,
          createdBy: smartFinance.creator,
          dueDate: new Date('2025-09-01'),
        },
        {
          project: smartFinance,
          title: 'Implement budget analytics',
          description:
            'Build analytics dashboard with charts and spending insights.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          assignedTo: bob,
          createdBy: smartFinance.creator,
          dueDate: new Date('2025-10-15'),
        },
        {
          project: smartFinance,
          title: 'Create financial reports export',
          description:
            'Add functionality to export reports in PDF and CSV formats.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
          assignedTo: charlie,
          createdBy: smartFinance.creator,
          dueDate: new Date('2025-12-20'),
        },
      ]
    : [];

  const allTasks = [
    ...eduConnectTasks,
    ...greenCartTasks,
    ...healthTrackerTasks,
    ...smartFinanceTasks,
  ];

  let totalCreated = 0;

  for (const taskData of allTasks) {
    const { assignedTo, ...rest } = taskData;
    const task = taskRepository.create({
      ...rest,
      ...(assignedTo && { assignedTo }),
    });
    await taskRepository.save(task);
    totalCreated++;
  }

  console.log(`✅ Successfully created ${totalCreated} tasks across projects`);
};
