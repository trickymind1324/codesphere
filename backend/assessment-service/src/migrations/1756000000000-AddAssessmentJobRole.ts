import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssessmentJobRole1756000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "jobRole" character varying(120)`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "assessments"."jobRole" IS 'Job role this assessment hires for (e.g. Backend Engineer)'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "jobRole"`);
  }
}
