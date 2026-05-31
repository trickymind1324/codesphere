import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddMultiFileSupport1738400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create problem_type enum
    await queryRunner.query(`
      CREATE TYPE problem_type_enum AS ENUM (
        'algorithmic',
        'debugging'
      );
    `);

    // Create validation_type enum
    await queryRunner.query(`
      CREATE TYPE validation_type_enum AS ENUM (
        'exact',
        'contains',
        'regex',
        'exit_code'
      );
    `);

    // Add problemType column to problems table
    await queryRunner.addColumn(
      'problems',
      new TableColumn({
        name: 'problemType',
        type: 'problem_type_enum',
        default: "'algorithmic'",
      }),
    );

    // Add executionConfig column to problems table
    await queryRunner.addColumn(
      'problems',
      new TableColumn({
        name: 'executionConfig',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Add index on problemType
    await queryRunner.createIndex(
      'problems',
      new TableIndex({
        name: 'IDX_problems_problemType',
        columnNames: ['problemType'],
      }),
    );

    // Add validationType column to test_cases table
    await queryRunner.addColumn(
      'test_cases',
      new TableColumn({
        name: 'validationType',
        type: 'validation_type_enum',
        default: "'exact'",
      }),
    );

    // Add files column to submissions table
    await queryRunner.addColumn(
      'submissions',
      new TableColumn({
        name: 'files',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Create problem_files table
    await queryRunner.createTable(
      new Table({
        name: 'problem_files',
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
            name: 'filePath',
            type: 'varchar',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'isEntryPoint',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isReadOnly',
            type: 'boolean',
            default: false,
          },
          {
            name: 'order',
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

    // Add foreign key to problems table
    await queryRunner.createForeignKey(
      'problem_files',
      new TableForeignKey({
        columnNames: ['problemId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'problems',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for problem_files
    await queryRunner.createIndex(
      'problem_files',
      new TableIndex({
        name: 'IDX_problem_files_problemId',
        columnNames: ['problemId'],
      }),
    );

    // Create unique index for problemId + language + filePath
    await queryRunner.createIndex(
      'problem_files',
      new TableIndex({
        name: 'IDX_problem_files_unique',
        columnNames: ['problemId', 'language', 'filePath'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop problem_files table
    await queryRunner.dropTable('problem_files', true);

    // Drop files column from submissions
    await queryRunner.dropColumn('submissions', 'files');

    // Drop validationType column from test_cases
    await queryRunner.dropColumn('test_cases', 'validationType');

    // Drop index from problems
    await queryRunner.dropIndex('problems', 'IDX_problems_problemType');

    // Drop executionConfig column from problems
    await queryRunner.dropColumn('problems', 'executionConfig');

    // Drop problemType column from problems
    await queryRunner.dropColumn('problems', 'problemType');

    // Drop enum types
    await queryRunner.query('DROP TYPE validation_type_enum');
    await queryRunner.query('DROP TYPE problem_type_enum');
  }
}
