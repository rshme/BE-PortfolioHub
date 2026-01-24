import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectsTable1769244000002 implements MigrationInterface {
  name = 'CreateProjectsTable1769244000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Projects Status Enum
    await queryRunner.query(
      `CREATE TYPE "public"."projects_status_enum" AS ENUM('draft', 'active', 'in_progress', 'completed', 'cancelled', 'on_hold')`,
    );

    // Create Projects Table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "creator_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "status" "public"."projects_status_enum" NOT NULL DEFAULT 'draft',
        "volunteers_needed" integer NOT NULL DEFAULT '0',
        "start_date" date,
        "end_date" date,
        "links" jsonb,
        "images" text array,
        "banner_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id")
      )
    `);

    // Add Foreign Key
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD CONSTRAINT "FK_4b86fad39217ca10aace123c7bd" 
      FOREIGN KEY ("creator_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_4b86fad39217ca10aace123c7bd"`,
    );
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
  }
}
