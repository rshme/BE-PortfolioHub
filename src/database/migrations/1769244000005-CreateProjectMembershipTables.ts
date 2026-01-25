import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectMembershipTables1769244000005 implements MigrationInterface {
  name = 'CreateProjectMembershipTables1769244000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Project Volunteers Status Enum
    await queryRunner.query(
      `CREATE TYPE "public"."project_volunteers_status_enum" AS ENUM('pending', 'approved', 'rejected', 'active', 'left')`,
    );

    // Create Project Volunteers Table
    await queryRunner.query(`
      CREATE TABLE "project_volunteers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "status" "public"."project_volunteers_status_enum" NOT NULL DEFAULT 'pending',
        "contribution_score" integer NOT NULL DEFAULT '0',
        "tasks_completed" integer NOT NULL DEFAULT '0',
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        "left_at" TIMESTAMP,
        CONSTRAINT "PK_103226bda7b5b27c119f277c114" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "project_volunteers" 
      ADD CONSTRAINT "FK_4dfdbd85a70e2cd145dc6c90acb" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "project_volunteers" 
      ADD CONSTRAINT "FK_2627d39be4f32732dc75a6fed1b" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create Project Mentors Status Enum
    await queryRunner.query(
      `CREATE TYPE "public"."project_mentors_status_enum" AS ENUM('pending', 'approved', 'rejected', 'active', 'left')`,
    );

    // Create Project Mentors Table
    await queryRunner.query(`
      CREATE TABLE "project_mentors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "expertise_areas" jsonb,
        "status" "public"."project_mentors_status_enum" NOT NULL DEFAULT 'pending',
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        "left_at" TIMESTAMP,
        CONSTRAINT "PK_591cc29ed3777466d74384b1f8a" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "project_mentors" 
      ADD CONSTRAINT "FK_4626890da778da1d78dd6574aed" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "project_mentors" 
      ADD CONSTRAINT "FK_2ddce19d55a74ea7c47444638a8" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_mentors" DROP CONSTRAINT "FK_2ddce19d55a74ea7c47444638a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_mentors" DROP CONSTRAINT "FK_4626890da778da1d78dd6574aed"`,
    );
    await queryRunner.query(`DROP TABLE "project_mentors"`);
    await queryRunner.query(`DROP TYPE "public"."project_mentors_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "project_volunteers" DROP CONSTRAINT "FK_2627d39be4f32732dc75a6fed1b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_volunteers" DROP CONSTRAINT "FK_4dfdbd85a70e2cd145dc6c90acb"`,
    );
    await queryRunner.query(`DROP TABLE "project_volunteers"`);
    await queryRunner.query(
      `DROP TYPE "public"."project_volunteers_status_enum"`,
    );
  }
}
