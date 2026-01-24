import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';
import { UserSeeder } from './seeders/user.seeder';

const runSeeders = async () => {
  console.log('🌱 Starting database seeding...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run User Seeder
    console.log('📝 Running User Seeder...');
    const userSeeder = new UserSeeder();
    await userSeeder.run(dataSource);

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runSeeders();
