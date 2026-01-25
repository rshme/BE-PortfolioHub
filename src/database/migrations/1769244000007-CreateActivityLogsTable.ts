import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogsTable1769244000007 implements MigrationInterface {
  name = 'CreateActivityLogsTable1769244000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Activity Type Enum
    await queryRunner.query(
      `CREATE TYPE "public"."activity_logs_action_type_enum" AS ENUM(
        'user_registered', 
        'user_login', 
        'user_logout', 
        'project_created', 
        'project_updated', 
        'project_deleted', 
        'task_created', 
        'task_updated', 
        'task_completed', 
        'volunteer_joined', 
        'volunteer_left', 
        'mentor_joined', 
        'badge_earned', 
        'message_sent', 
        'comment_added'
      )`,
    );

    // Create Activity Logs Table
    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "action_type" "public"."activity_logs_action_type_enum" NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_logs" 
      ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d54f841fa5478e4734590d44036"`,
    );
    await queryRunner.query(`DROP TABLE "activity_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."activity_logs_action_type_enum"`,
    );
  }
}
