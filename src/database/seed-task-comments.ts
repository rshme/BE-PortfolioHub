import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';
import { TaskCommentSeeder } from './seeders/task-comment.seeder';

const runTaskCommentSeeder = async () => {
  console.log('🌱 Starting Task Comment Seeding...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run Task Comment Seeder
    console.log('💬 Running Task Comment Seeder...');
    const taskCommentSeeder = new TaskCommentSeeder();
    await taskCommentSeeder.run(dataSource);
    console.log('');

    console.log('\n🎉 Task comment seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during task comment seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runTaskCommentSeeder();
