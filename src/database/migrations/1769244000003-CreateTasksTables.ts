import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTables1769244000003 implements MigrationInterface {
  name = 'CreateTasksTables1769244000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Task Priority and Status Enums
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('todo', 'in_progress', 'in_review', 'completed', 'cancelled')`,
    );

    // Create Tasks Table
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "assigned_to" uuid,
        "created_by" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium',
        "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'todo',
        "due_date" date,
        "tags" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
      )
    `);

    // Create Task Comments Table
    await queryRunner.query(`
      CREATE TABLE "task_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "task_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_83b99b0b03db29d4cafcb579b77" PRIMARY KEY ("id")
      )
    `);

    // Add Foreign Keys for Tasks
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_5770b28d72ca90c43b1381bf787" 
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08" 
      FOREIGN KEY ("created_by") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add Foreign Keys for Task Comments
    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD CONSTRAINT "FK_ba9e465cfc707006e60aae59946" 
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_comments" 
      ADD CONSTRAINT "FK_07ff0d4347a198527663bda63d9" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_07ff0d4347a198527663bda63d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_ba9e465cfc707006e60aae59946"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_5770b28d72ca90c43b1381bf787"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`,
    );
    await queryRunner.query(`DROP TABLE "task_comments"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
  }
}
