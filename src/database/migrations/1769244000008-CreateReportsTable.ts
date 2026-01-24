import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportsTable1769244000008 implements MigrationInterface {
  name = 'CreateReportsTable1769244000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Report Status Enum
    await queryRunner.query(
      `CREATE TYPE "public"."reports_status_enum" AS ENUM('pending', 'under_review', 'resolved', 'rejected', 'escalated')`,
    );

    // Create Reports Table
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reporter_id" uuid NOT NULL,
        "reported_user_id" uuid,
        "reported_project_id" uuid,
        "reason" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "status" "public"."reports_status_enum" NOT NULL DEFAULT 'pending',
        "reviewed_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP,
        CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id")
      )
    `);

    // Add Foreign Keys
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" 
      FOREIGN KEY ("reporter_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_a9197bd0a7e06bb92648d9efed2" 
      FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_43c3ecaf43143c55722ba1673e2" 
      FOREIGN KEY ("reported_project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_e8fa0bffcaebc921b1e8e42a82f" 
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_e8fa0bffcaebc921b1e8e42a82f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_43c3ecaf43143c55722ba1673e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_a9197bd0a7e06bb92648d9efed2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`,
    );
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
  }
}
