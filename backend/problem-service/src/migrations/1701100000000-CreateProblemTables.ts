import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProblemTables1701100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE problem_difficulty_enum AS ENUM ('easy', 'medium', 'hard');
    `);

    await queryRunner.query(`
      CREATE TYPE problem_status_enum AS ENUM ('draft', 'published', 'archived');
    `);

    await queryRunner.query(`
      CREATE TYPE programming_language_enum AS ENUM (
        'python', 'javascript', 'typescript', 'java', 'cpp', 'c',
        'go', 'rust', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'sql'
      );
    `);

    // Create tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'slug',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'problemCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create problems table
    await queryRunner.createTable(
      new Table({
        name: 'problems',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'slug',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'difficulty',
            type: 'problem_difficulty_enum',
            default: "'easy'",
          },
          {
            name: 'status',
            type: 'problem_status_enum',
            default: "'draft'",
          },
          {
            name: 'isPremium',
            type: 'boolean',
            default: false,
          },
          {
            name: 'hints',
            type: 'text[]',
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'examples',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'constraints',
            type: 'text[]',
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'companies',
            type: 'text[]',
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'totalSubmissions',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalAccepted',
            type: 'integer',
            default: 0,
          },
          {
            name: 'acceptanceRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'timeComplexity',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'spaceComplexity',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'timeLimitMs',
            type: 'integer',
            default: 2000,
          },
          {
            name: 'memoryLimitMb',
            type: 'integer',
            default: 128,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create test_cases table
    await queryRunner.createTable(
      new Table({
        name: 'test_cases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'problemId',
            type: 'uuid',
          },
          {
            name: 'input',
            type: 'text',
          },
          {
            name: 'expectedOutput',
            type: 'text',
          },
          {
            name: 'explanation',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isExample',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isHidden',
            type: 'boolean',
            default: false,
          },
          {
            name: 'order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 1.0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create starter_codes table
    await queryRunner.createTable(
      new Table({
        name: 'starter_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'problemId',
            type: 'uuid',
          },
          {
            name: 'language',
            type: 'programming_language_enum',
          },
          {
            name: 'code',
            type: 'text',
          },
          {
            name: 'functionName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create problem_tags junction table
    await queryRunner.createTable(
      new Table({
        name: 'problem_tags',
        columns: [
          {
            name: 'problem_id',
            type: 'uuid',
          },
          {
            name: 'tag_id',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'test_cases',
      new TableForeignKey({
        columnNames: ['problemId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'problems',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'starter_codes',
      new TableForeignKey({
        columnNames: ['problemId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'problems',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'problem_tags',
      new TableForeignKey({
        columnNames: ['problem_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'problems',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'problem_tags',
      new TableForeignKey({
        columnNames: ['tag_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_tags_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'problems',
      new TableIndex({
        name: 'IDX_problems_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'problems',
      new TableIndex({
        name: 'IDX_problems_title',
        columnNames: ['title'],
      }),
    );

    await queryRunner.createIndex(
      'problems',
      new TableIndex({
        name: 'IDX_problems_status_difficulty',
        columnNames: ['status', 'difficulty'],
      }),
    );

    await queryRunner.createIndex(
      'test_cases',
      new TableIndex({
        name: 'IDX_test_cases_problemId',
        columnNames: ['problemId'],
      }),
    );

    await queryRunner.createIndex(
      'test_cases',
      new TableIndex({
        name: 'IDX_test_cases_problemId_isHidden',
        columnNames: ['problemId', 'isHidden'],
      }),
    );

    await queryRunner.createIndex(
      'starter_codes',
      new TableIndex({
        name: 'IDX_starter_codes_problemId',
        columnNames: ['problemId'],
      }),
    );

    await queryRunner.createIndex(
      'starter_codes',
      new TableIndex({
        name: 'IDX_starter_codes_problemId_language',
        columnNames: ['problemId', 'language'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'problem_tags',
      new TableIndex({
        name: 'IDX_problem_tags_problem_id',
        columnNames: ['problem_id'],
      }),
    );

    await queryRunner.createIndex(
      'problem_tags',
      new TableIndex({
        name: 'IDX_problem_tags_tag_id',
        columnNames: ['tag_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('problem_tags', true);
    await queryRunner.dropTable('starter_codes', true);
    await queryRunner.dropTable('test_cases', true);
    await queryRunner.dropTable('problems', true);
    await queryRunner.dropTable('tags', true);

    // Drop enum types
    await queryRunner.query('DROP TYPE programming_language_enum');
    await queryRunner.query('DROP TYPE problem_status_enum');
    await queryRunner.query('DROP TYPE problem_difficulty_enum');
  }
}
