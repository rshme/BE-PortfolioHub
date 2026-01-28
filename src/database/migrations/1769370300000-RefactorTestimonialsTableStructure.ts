import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class RefactorTestimonialsTableStructure1769370300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old author columns
    await queryRunner.dropColumn('testimonials', 'author_name');
    await queryRunner.dropColumn('testimonials', 'author_position');
    await queryRunner.dropColumn('testimonials', 'author_company');
    await queryRunner.dropColumn('testimonials', 'author_avatar_url');

    // Add reviewer_id column
    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({
        name: 'reviewer_id',
        type: 'uuid',
      }),
    );

    // Create foreign key for reviewer_id
    await queryRunner.createForeignKey(
      'testimonials',
      new TableForeignKey({
        columnNames: ['reviewer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_testimonials_reviewer',
      }),
    );

    // Create index for reviewer_id
    await queryRunner.query(
      `CREATE INDEX "IDX_testimonials_reviewer_id" ON "testimonials" ("reviewer_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(
      `DROP INDEX "IDX_testimonials_reviewer_id"`,
    );

    // Drop foreign key
    await queryRunner.dropForeignKey(
      'testimonials',
      'FK_testimonials_reviewer',
    );

    // Drop reviewer_id column
    await queryRunner.dropColumn('testimonials', 'reviewer_id');

    // Restore old author columns
    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({
        name: 'author_name',
        type: 'varchar',
        length: '100',
      }),
    );

    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({
        name: 'author_position',
        type: 'varchar',
        length: '150',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({
        name: 'author_company',
        type: 'varchar',
        length: '150',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({
        name: 'author_avatar_url',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
