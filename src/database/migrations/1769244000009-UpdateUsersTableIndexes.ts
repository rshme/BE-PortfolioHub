import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersTableIndexes1769244000009 implements MigrationInterface {
  name = 'UpdateUsersTableIndexes1769244000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_username"`);

    // Remove username default value
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "username" DROP DEFAULT`,
    );

    // Rename user_role_enum to users_role_enum for consistency
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'mentor', 'volunteer', 'project_owner')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'volunteer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);

    // Create new indexes with consistent naming
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );

    // Revert enum rename
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum_old" AS ENUM('admin', 'mentor', 'volunteer', 'project_owner')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'volunteer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`,
    );

    // Restore username default
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "username" SET DEFAULT ''`,
    );

    // Restore old indexes
    await queryRunner.query(
      `CREATE INDEX "idx_users_username" ON "users" ("username")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
  }
}
