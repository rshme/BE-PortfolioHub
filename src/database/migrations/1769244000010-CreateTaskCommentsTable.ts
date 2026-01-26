import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskCommentsTable1769244000010
  implements MigrationInterface
{
  name = 'CreateTaskCommentsTable1769244000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to existing task_comments table for threaded comments support
    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD COLUMN "parent_comment_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD COLUMN "is_edited" boolean NOT NULL DEFAULT false
    `);

    // Add self-referencing foreign key for parent comment (threaded comments)
    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD CONSTRAINT "FK_task_comments_parent" 
      FOREIGN KEY ("parent_comment_id") REFERENCES "task_comments"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_task_comments_task_id" 
      ON "task_comments" ("task_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_comments_user_id" 
      ON "task_comments" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_comments_parent_comment_id" 
      ON "task_comments" ("parent_comment_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_comments_created_at" 
      ON "task_comments" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_task_comments_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_task_comments_parent_comment_id"`);
    await queryRunner.query(`DROP INDEX "IDX_task_comments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_task_comments_task_id"`);

    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_parent"`,
    );

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP COLUMN "is_edited"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP COLUMN "parent_comment_id"`,
    );
  }
}
