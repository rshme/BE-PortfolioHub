import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameToUsers1737692000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add username column
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN username VARCHAR NOT NULL DEFAULT ''
    `);

    // Add unique constraint
    await queryRunner.query(`
      ALTER TABLE users 
      ADD CONSTRAINT UQ_users_username UNIQUE (username)
    `);

    // Add index for performance
    await queryRunner.query(`
      CREATE INDEX IDX_users_username ON users(username)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_users_username
    `);

    // Drop unique constraint
    await queryRunner.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS UQ_users_username
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS username
    `);
  }
}
