import { DataSource } from 'typeorm';
import { TaskComment } from '../../modules/tasks/entities/task-comment.entity';
import { Task } from '../../modules/tasks/entities/task.entity';
import { User } from '../../modules/users/entities/user.entity';

export class TaskCommentSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const taskCommentRepository = dataSource.getRepository(TaskComment);
    const taskRepository = dataSource.getRepository(Task);
    const userRepository = dataSource.getRepository(User);

    // Check if task comments already exist
    const existingCount = await taskCommentRepository.count();
    if (existingCount > 0) {
      console.log('ℹ️  Task comments already exist. Clearing for fresh seed...');
      await taskCommentRepository.clear();
    }

    const tasks = await taskRepository.find({
      take: 20,
      relations: ['assignedTo'],
    });

    if (tasks.length === 0) {
      console.log('⚠️  No tasks found. Please run task seeder first.');
      return;
    }

    const users = await userRepository.find({
      take: 10,
    });

    if (users.length === 0) {
      console.log('⚠️  No users found. Please run user seeder first.');
      return;
    }

    const commentTemplates = [
      'Great progress on this task! Keep up the good work.',
      'I have a question about the implementation approach.',
      'This looks good, but we might want to consider edge cases.',
      'Can you provide more details about the requirements?',
      'I\'ve completed my part. Ready for review.',
      'Encountered a blocker with the third-party API.',
      'Updated the code based on feedback. Please review.',
      'This might conflict with the recent changes in the main branch.',
      'Added unit tests for the new functionality.',
      'Need help with the database migration script.',
      'Refactored the code for better readability.',
      'Found a bug in the existing implementation.',
      'Merged the latest changes from develop branch.',
      'Documentation has been updated accordingly.',
      'Performance optimization applied successfully.',
      'Added error handling for edge cases.',
      'Code review completed. Looks good to merge.',
      'Updated dependencies to latest versions.',
      'Fixed the styling issues mentioned in the review.',
      'Implemented the suggested design pattern.',
      'Added validation for user inputs.',
      'Optimized database queries for better performance.',
      'Created integration tests for the API endpoints.',
      'Resolved merge conflicts with feature branch.',
      'Updated API documentation with new endpoints.',
    ];

    const taskComments: TaskComment[] = [];

    // Create 2-5 comments per task
    for (const task of tasks) {
      const numComments = Math.floor(Math.random() * 4) + 2; // 2-5 comments

      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomTemplate =
          commentTemplates[
            Math.floor(Math.random() * commentTemplates.length)
          ];

        const comment = taskCommentRepository.create({
          taskId: task.id,
          userId: randomUser.id,
          content: randomTemplate,
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
          ), // Random date within last 30 days
        });

        taskComments.push(comment);
      }
    }

    await taskCommentRepository.save(taskComments);
    console.log(`✅ Successfully created ${taskComments.length} task comments`);
  }
}
