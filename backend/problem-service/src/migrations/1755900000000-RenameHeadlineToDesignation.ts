import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameHeadlineToDesignation1755900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "headline" TO "designation"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "designation" TO "headline"`);
  }
}
