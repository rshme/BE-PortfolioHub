import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskCommentsTable1769244000010
  implements MigrationInterface
{
  name = 'CreateTaskCommentsTable1769244000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create task_comments table with support for threaded comments
    await queryRunner.query(`
      CREATE TABLE "task_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "task_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "parent_comment_id" uuid,
        "content" text NOT NULL,
        "is_edited" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_comments" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for task_id
    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD CONSTRAINT "FK_task_comments_task" 
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add foreign key constraint for user_id
    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD CONSTRAINT "FK_task_comments_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
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

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_task"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "task_comments"`);
  }
}
