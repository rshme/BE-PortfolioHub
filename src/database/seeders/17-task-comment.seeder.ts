import { DataSource } from 'typeorm';
import { TaskComment } from '../../modules/task-comments/entities/task-comment.entity';
import { Task } from '../../modules/tasks/entities/task.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ProjectVolunteer } from '../../modules/projects/entities/project-volunteer.entity';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';

export class TaskCommentSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const taskCommentRepository = dataSource.getRepository(TaskComment);
    const taskRepository = dataSource.getRepository(Task);
    const projectVolunteerRepository = dataSource.getRepository(ProjectVolunteer);

    // Check if data already exists
    const count = await taskCommentRepository.count();
    if (count > 0) {
      console.log('✅ Task comments already seeded, skipping...');
      return;
    }

    // Get all tasks with their projects
    const tasks = await taskRepository.find({
      relations: ['project'],
    });

    if (tasks.length === 0) {
      console.log('⚠️ No tasks found, skipping task comments seeding');
      return;
    }

    const taskComments: Array<{
      taskId: string;
      userId: string;
      content: string;
      createdAt: Date;
    }> = [];

    // Create comments for tasks
    for (const task of tasks) {
      // Get volunteers for this project
      const volunteers = await projectVolunteerRepository.find({
        where: { projectId: task.projectId, status: VolunteerStatus.APPROVED },
      });

      if (volunteers.length === 0) continue;

      // Create 0-5 comments per task
      const commentCount = Math.floor(Math.random() * 6); // 0 to 5 comments
      
      if (commentCount === 0) continue;

      const commentTemplates = [
        "I've started working on this task. Will update progress soon.",
        "Could someone review my approach before I proceed?",
        "I'm encountering some issues with the implementation. Any suggestions?",
        "This is more complex than expected. Might need some help.",
        "Progress update: 50% complete. On track to finish by the deadline.",
        "I've completed the main functionality. Running tests now.",
        "Found a bug while testing. Working on a fix.",
        "This task is blocked by another dependency. Waiting for it to be resolved.",
        "Great work on this! Just added a minor improvement.",
        "All tests are passing. Ready for review.",
        "I've updated the documentation as well.",
        "Question: Should we also handle edge case X?",
        "Implemented the feature successfully. Please review when you have time.",
        "Made some optimizations based on the code review feedback.",
        "This is ready to merge. All checks are passing.",
      ];

      for (let i = 0; i < commentCount; i++) {
        // Select random volunteer as commenter
        const randomVolunteer = volunteers[Math.floor(Math.random() * volunteers.length)];
        
        // Create comment at different times
        const hoursAgo = Math.floor(Math.random() * 168); // Within last week
        const createdAt = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));

        taskComments.push({
          taskId: task.id,
          userId: randomVolunteer.userId,
          content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
          createdAt,
        });
      }
    }

    if (taskComments.length > 0) {
      await taskCommentRepository.save(taskComments);
      console.log(`✅ Seeded ${taskComments.length} task comments`);
    } else {
      console.log('✅ No task comments to seed');
    }
  }
}
