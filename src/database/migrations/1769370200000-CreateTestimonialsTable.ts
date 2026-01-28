import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTestimonialsTable1769370200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'testimonials',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'author_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'author_position',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'author_company',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'author_avatar_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'rating',
            type: 'int',
            default: 5,
          },
          {
            name: 'relationship',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'project_context',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'testimonials',
      new TableIndex({
        name: 'IDX_testimonials_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'testimonials',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_testimonials_user',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('testimonials', 'FK_testimonials_user');
    await queryRunner.dropIndex('testimonials', 'IDX_testimonials_user_id');
    await queryRunner.dropTable('testimonials');
  }
}
