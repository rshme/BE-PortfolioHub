import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitationAndVolunteerCountFields1769280000000 implements MigrationInterface {
  name = 'AddInvitationAndVolunteerCountFields1769280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add invited_by column to project_mentors table
    await queryRunner.query(`
      ALTER TABLE "project_mentors"
      ADD COLUMN "invited_by" uuid,
      ADD COLUMN "application_message" text
    `);

    await queryRunner.query(`
      ALTER TABLE "project_mentors"
      ADD CONSTRAINT "FK_project_mentors_invited_by"
      FOREIGN KEY ("invited_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Add invited_by column to project_volunteers table
    await queryRunner.query(`
      ALTER TABLE "project_volunteers"
      ADD COLUMN "invited_by" uuid,
      ADD COLUMN "application_message" text
    `);

    await queryRunner.query(`
      ALTER TABLE "project_volunteers"
      ADD CONSTRAINT "FK_project_volunteers_invited_by"
      FOREIGN KEY ("invited_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Add volunteer_count column to projects table
    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD COLUMN "volunteer_count" integer NOT NULL DEFAULT 0
    `);

    // Update volunteer_count based on existing active volunteers
    await queryRunner.query(`
      UPDATE "projects" p
      SET "volunteer_count" = (
        SELECT COUNT(*)
        FROM "project_volunteers" pv
        WHERE pv."project_id" = p."id"
        AND pv."status" IN ('active', 'approved')
      )
    `);

    // Add indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_project_mentors_status" ON "project_mentors" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_project_volunteers_status" ON "project_volunteers" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_project_mentors_user_project" ON "project_mentors" ("user_id", "project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_project_volunteers_user_project" ON "project_volunteers" ("user_id", "project_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_project_volunteers_user_project"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_project_mentors_user_project"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_project_volunteers_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_project_mentors_status"`);

    // Drop volunteer_count column
    await queryRunner.query(`
      ALTER TABLE "projects" DROP COLUMN "volunteer_count"
    `);

    // Drop invited_by from project_volunteers
    await queryRunner.query(`
      ALTER TABLE "project_volunteers"
      DROP CONSTRAINT "FK_project_volunteers_invited_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "project_volunteers"
      DROP COLUMN "application_message",
      DROP COLUMN "invited_by"
    `);

    // Drop invited_by from project_mentors
    await queryRunner.query(`
      ALTER TABLE "project_mentors"
      DROP CONSTRAINT "FK_project_mentors_invited_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "project_mentors"
      DROP COLUMN "application_message",
      DROP COLUMN "invited_by"
    `);
  }
}
