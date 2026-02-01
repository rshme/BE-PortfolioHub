import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/typeorm.config';
import { TaskCommentSeeder } from './task-comment.seeder';

const runTaskCommentSeeder = async () => {
  console.log('🌱 Starting Task Comment Seeder...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const seeder = new TaskCommentSeeder();
    await seeder.run(dataSource);

    console.log('\n🎉 Task Comment seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runTaskCommentSeeder();
