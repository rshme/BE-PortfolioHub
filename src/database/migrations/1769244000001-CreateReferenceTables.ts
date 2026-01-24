import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReferenceTables1769244000001 implements MigrationInterface {
  name = 'CreateReferenceTables1769244000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Categories Table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "icon" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"),
        CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
      )
    `);

    // Create Skills Table
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "icon" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_81f05095507fd84aa2769b4a522" UNIQUE ("name"),
        CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id")
      )
    `);

    // Create Badges Table
    await queryRunner.query(
      `CREATE TYPE "public"."badges_rarity_enum" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary')`,
    );
    await queryRunner.query(`
      CREATE TABLE "badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "icon_url" character varying,
        "criteria" jsonb,
        "rarity" "public"."badges_rarity_enum" NOT NULL DEFAULT 'common',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_9c91fc9c4a4ae01712baad1e9f6" UNIQUE ("name"),
        CONSTRAINT "PK_8a651318b8de577e8e217676466" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "badges"`);
    await queryRunner.query(`DROP TYPE "public"."badges_rarity_enum"`);
    await queryRunner.query(`DROP TABLE "skills"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
