import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssessmentResults1755600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assessment_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invitationId" uuid NOT NULL,
        "problemId" uuid NOT NULL,
        "passed" boolean NOT NULL DEFAULT false,
        "pointsAwarded" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_assessment_results" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assessment_result_invitation_problem" UNIQUE ("invitationId", "problemId")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_assessment_results_invitationId" ON "assessment_results"("invitationId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessment_results_invitationId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assessment_results"`);
  }
}
