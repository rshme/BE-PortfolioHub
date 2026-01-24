import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJunctionTables1769244000004 implements MigrationInterface {
  name = 'CreateJunctionTables1769244000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create User Skills Junction Table
    await queryRunner.query(`
      CREATE TABLE "user_skills" (
        "user_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        CONSTRAINT "PK_816eba68a0ca1b837ec15daefc7" PRIMARY KEY ("user_id", "skill_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_skills" 
      ADD CONSTRAINT "FK_6926002c360291df66bb2c5fdeb" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_skills" 
      ADD CONSTRAINT "FK_eb69710b0a00f42fb95fc2ac2f5" 
      FOREIGN KEY ("skill_id") REFERENCES "skills"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create User Badges Junction Table
    await queryRunner.query(`
      CREATE TABLE "user_badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "badge_id" uuid NOT NULL,
        "awarded_by" uuid,
        "reason" text,
        "awarded_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_0ca139216824d745a930065706a" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_badges" 
      ADD CONSTRAINT "FK_f1221d9b1aaa64b1f3c98ed46d3" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_badges" 
      ADD CONSTRAINT "FK_715b81e610ab276ff6603cfc8e8" 
      FOREIGN KEY ("badge_id") REFERENCES "badges"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_badges" 
      ADD CONSTRAINT "FK_42033445d34eeeae81930d9eb47" 
      FOREIGN KEY ("awarded_by") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create Project Categories Junction Table
    await queryRunner.query(`
      CREATE TABLE "project_categories" (
        "project_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_22678ac55b543b00a6eeb3f92ca" PRIMARY KEY ("project_id", "category_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "project_categories" 
      ADD CONSTRAINT "FK_3a55961fc2a7ee7e324844cb2f9" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "project_categories" 
      ADD CONSTRAINT "FK_678d720a87c534b1043688d8d96" 
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create Project Skills Junction Table
    await queryRunner.query(`
      CREATE TABLE "project_skills" (
        "project_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        "is_mandatory" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_bca1832e4e611ff667ad2a31de1" PRIMARY KEY ("project_id", "skill_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "project_skills" 
      ADD CONSTRAINT "FK_d28a809ea4c3e5d71a5679a33b4" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "project_skills" 
      ADD CONSTRAINT "FK_903cd0ac4cc4681039d306c485e" 
      FOREIGN KEY ("skill_id") REFERENCES "skills"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_skills" DROP CONSTRAINT "FK_903cd0ac4cc4681039d306c485e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_skills" DROP CONSTRAINT "FK_d28a809ea4c3e5d71a5679a33b4"`,
    );
    await queryRunner.query(`DROP TABLE "project_skills"`);

    await queryRunner.query(
      `ALTER TABLE "project_categories" DROP CONSTRAINT "FK_678d720a87c534b1043688d8d96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_categories" DROP CONSTRAINT "FK_3a55961fc2a7ee7e324844cb2f9"`,
    );
    await queryRunner.query(`DROP TABLE "project_categories"`);

    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_42033445d34eeeae81930d9eb47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_715b81e610ab276ff6603cfc8e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_f1221d9b1aaa64b1f3c98ed46d3"`,
    );
    await queryRunner.query(`DROP TABLE "user_badges"`);

    await queryRunner.query(
      `ALTER TABLE "user_skills" DROP CONSTRAINT "FK_eb69710b0a00f42fb95fc2ac2f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_skills" DROP CONSTRAINT "FK_6926002c360291df66bb2c5fdeb"`,
    );
    await queryRunner.query(`DROP TABLE "user_skills"`);
  }
}
