import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssessmentTables1735300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create assessments table
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "durationMinutes" integer NOT NULL DEFAULT 120,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "createdBy" uuid,
        "updatedBy" uuid,
        "totalInvitations" integer NOT NULL DEFAULT 0,
        "completedSubmissions" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        "deletedAt" timestamp with time zone,
        CONSTRAINT "CHK_assessment_status" CHECK (status IN ('draft', 'published', 'archived'))
      )
    `);

    // Create assessment_problems junction table
    await queryRunner.query(`
      CREATE TABLE "assessment_problems" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "assessmentId" uuid NOT NULL,
        "problemId" uuid NOT NULL,
        "order" integer NOT NULL,
        "points" integer NOT NULL DEFAULT 10,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "FK_assessment_problems_assessment"
          FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_assessment_problem" UNIQUE ("assessmentId", "problemId")
      )
    `);

    // Create assessment_invitations table
    await queryRunner.query(`
      CREATE TABLE "assessment_invitations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "assessmentId" uuid NOT NULL,
        "candidateEmail" varchar(255) NOT NULL,
        "candidateName" varchar(255),
        "uniqueToken" varchar(64) NOT NULL UNIQUE,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "expiresAt" timestamp with time zone NOT NULL,
        "startedAt" timestamp with time zone,
        "completedAt" timestamp with time zone,
        "score" integer,
        "percentage" integer,
        "problemsSolved" integer,
        "customMessage" text,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "FK_assessment_invitations_assessment"
          FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_invitation_status" CHECK (status IN ('pending', 'started', 'completed', 'expired'))
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_assessments_createdBy" ON "assessments"("createdBy")`);
    await queryRunner.query(`CREATE INDEX "IDX_assessments_status" ON "assessments"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_assessments_createdAt" ON "assessments"("createdAt")`);

    await queryRunner.query(`CREATE INDEX "IDX_assessment_problems_assessmentId" ON "assessment_problems"("assessmentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_assessment_problems_problemId" ON "assessment_problems"("problemId")`);
    await queryRunner.query(`CREATE INDEX "IDX_assessment_problems_order" ON "assessment_problems"("assessmentId", "order")`);

    await queryRunner.query(`CREATE INDEX "IDX_invitations_assessmentId" ON "assessment_invitations"("assessmentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_candidateEmail" ON "assessment_invitations"("candidateEmail")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_token" ON "assessment_invitations"("uniqueToken")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_status" ON "assessment_invitations"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_expiresAt" ON "assessment_invitations"("expiresAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invitations_expiresAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invitations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invitations_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invitations_candidateEmail"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invitations_assessmentId"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessment_problems_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessment_problems_problemId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessment_problems_assessmentId"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assessments_createdBy"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "assessment_invitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assessment_problems"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assessments"`);
  }
}
