import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';
import { CreateUserInterestsTable1780000000001 } from './migrations/1780000000001-CreateUserInterestsTable';

const runUserInterestsMigration = async () => {
  console.log('🔄 Running User Interests Migration...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = dataSource.createQueryRunner();

    // Check if migration already ran
    const hasMigrationTable = await queryRunner.hasTable('migrations');
    if (hasMigrationTable) {
      const result = await queryRunner.query(
        `SELECT * FROM migrations WHERE name = 'CreateUserInterestsTable1780000000001'`,
      );

      if (result.length > 0) {
        console.log('⚠️  User Interests migration already executed. Skipping...');
        return;
      }
    }

    const migration = new CreateUserInterestsTable1780000000001();
    await migration.up(queryRunner);

    // Record migration
    if (hasMigrationTable) {
      await queryRunner.query(
        `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
        [Date.now(), 'CreateUserInterestsTable1780000000001'],
      );
    }

    console.log('✅ User Interests migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runUserInterestsMigration();
