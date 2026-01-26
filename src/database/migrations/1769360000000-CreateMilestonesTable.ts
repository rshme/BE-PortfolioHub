import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMilestonesTable1769360000000
  implements MigrationInterface
{
  name = 'CreateMilestonesTable1769360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Milestone Status Enum
    await queryRunner.query(
      `CREATE TYPE "public"."milestones_status_enum" AS ENUM('not_started', 'in_progress', 'completed', 'cancelled')`,
    );

    // Create Milestones Table
    await queryRunner.query(`
      CREATE TABLE "milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" "public"."milestones_status_enum" NOT NULL DEFAULT 'not_started',
        "order_position" integer NOT NULL DEFAULT 0,
        "start_date" date,
        "end_date" date,
        "tags" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_af23a3c347a98324b98691f3936" PRIMARY KEY ("id")
      )
    `);

    // Add Foreign Key for project_id
    await queryRunner.query(`
      ALTER TABLE "milestones" 
      ADD CONSTRAINT "FK_milestones_project_id" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create index for project_id and order_position for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_milestones_project_id" ON "milestones" ("project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_milestones_order_position" ON "milestones" ("project_id", "order_position")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_milestones_order_position"`);
    await queryRunner.query(`DROP INDEX "IDX_milestones_project_id"`);
    await queryRunner.query(
      `ALTER TABLE "milestones" DROP CONSTRAINT "FK_milestones_project_id"`,
    );
    await queryRunner.query(`DROP TABLE "milestones"`);
    await queryRunner.query(`DROP TYPE "public"."milestones_status_enum"`);
  }
}
