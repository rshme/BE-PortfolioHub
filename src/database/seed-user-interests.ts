import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';
import { seedUserInterests } from './seeders/user-interest.seeder';

const runUserInterestsSeeder = async () => {
  console.log('🌱 Running User Interests Seeder...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    console.log('🎯 Running User Interests Seeder...');
    await seedUserInterests(dataSource);
    console.log('');

    console.log('🎉 User Interests seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runUserInterestsSeeder();
