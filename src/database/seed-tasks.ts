import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';
import { seedTasks } from './seeders/task-v2.seeder';

const runTaskSeeder = async () => {
  console.log('🌱 Starting Task Seeding...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run Task Seeder
    console.log('✅ Running Task Seeder...');
    await seedTasks(dataSource);
    console.log('');

    console.log('\n🎉 Task seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during task seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runTaskSeeder();
