import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTasksToRelateToMilestones1769360100000
  implements MigrationInterface
{
  name = 'UpdateTasksToRelateToMilestones1769360100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add milestone_id column to tasks table
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD COLUMN "milestone_id" uuid
    `);

    // For existing tasks, we'll keep project_id temporarily for data migration purposes
    // In a real scenario, you might want to create a default milestone for each project

    // Add Foreign Key for milestone_id
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_tasks_milestone_id" 
      FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create index for milestone_id for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_milestone_id" ON "tasks" ("milestone_id")
    `);

    // Drop the old project_id foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"
    `);

    // Note: We keep project_id column for now to maintain backward compatibility
    // and for queries that need project context. Tasks will now primarily relate to milestones.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the project_id foreign key
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Drop milestone-related changes
    await queryRunner.query(`DROP INDEX "IDX_tasks_milestone_id"`);
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_milestone_id"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "milestone_id"`);
  }
}
