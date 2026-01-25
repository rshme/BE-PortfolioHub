import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelToProjects1769359326000 implements MigrationInterface {
  name = 'AddLevelToProjects1769359326000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Project Level Enum
    await queryRunner.query(
      `CREATE TYPE "public"."projects_level_enum" AS ENUM('beginner', 'intermediate', 'advanced')`,
    );

    // Add level column to projects table
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD "level" "public"."projects_level_enum" NOT NULL DEFAULT 'beginner'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove level column from projects table
    await queryRunner.query(`
      ALTER TABLE "projects" DROP COLUMN "level"
    `);

    // Drop Project Level Enum
    await queryRunner.query(`DROP TYPE "public"."projects_level_enum"`);
  }
}
