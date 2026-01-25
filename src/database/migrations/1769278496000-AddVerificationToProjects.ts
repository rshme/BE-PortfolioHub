import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddVerificationToProjects1769278496000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_verified column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'is_verified',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    // Add verified_by column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'verified_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key constraint for verified_by
    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['verified_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_projects_verified_by',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('projects', 'FK_projects_verified_by');

    // Drop columns
    await queryRunner.dropColumn('projects', 'verified_by');
    await queryRunner.dropColumn('projects', 'is_verified');
  }
}
