import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSubmissionsTable1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create submission status enum
    await queryRunner.query(`
      CREATE TYPE submission_status_enum AS ENUM (
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'runtime_error',
        'compilation_error',
        'internal_error'
      );
    `);

    // Create submissions table
    await queryRunner.createTable(
      new Table({
        name: 'submissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'problemId',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'text',
          },
          {
            name: 'language',
            type: 'programming_language_enum',
          },
          {
            name: 'status',
            type: 'submission_status_enum',
          },
          {
            name: 'totalTestCases',
            type: 'integer',
            default: 0,
          },
          {
            name: 'passedTestCases',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failedTestCases',
            type: 'integer',
            default: 0,
          },
          {
            name: 'executionTimeMs',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'memoryUsageKb',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'testResults',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key to problems table
    await queryRunner.createForeignKey(
      'submissions',
      new TableForeignKey({
        columnNames: ['problemId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'problems',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'IDX_submissions_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'IDX_submissions_problemId',
        columnNames: ['problemId'],
      }),
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'IDX_submissions_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'IDX_submissions_problemId_status',
        columnNames: ['problemId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'IDX_submissions_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.dropTable('submissions', true);

    // Drop enum type
    await queryRunner.query('DROP TYPE submission_status_enum');
  }
}
