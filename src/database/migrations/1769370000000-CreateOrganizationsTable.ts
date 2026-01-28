import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrganizationsTable1769370000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organizations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'industry',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'website_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'employee_count',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'founded_year',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'social_links',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'mission',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'vision',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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
      'organizations',
      new TableIndex({
        name: 'IDX_organizations_name',
        columnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('organizations', 'IDX_organizations_name');
    await queryRunner.dropTable('organizations');
  }
}
