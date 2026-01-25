import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunicationTables1769244000006 implements MigrationInterface {
  name = 'CreateCommunicationTables1769244000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Messages Table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sender_id" uuid NOT NULL,
        "receiver_id" uuid NOT NULL,
        "content" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "read_at" TIMESTAMP,
        CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" 
      FOREIGN KEY ("sender_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_b561864743d235f44e70addc1f5" 
      FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create Notification Type Enum
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM(
        'project_invitation', 
        'task_assigned', 
        'task_completed', 
        'badge_earned', 
        'message_received', 
        'mentor_request', 
        'project_update', 
        'comment_received', 
        'volunteer_request', 
        'system_announcement'
      )`,
    );

    // Create Notifications Table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "read_at" TIMESTAMP,
        CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);

    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_b561864743d235f44e70addc1f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
  }
}
