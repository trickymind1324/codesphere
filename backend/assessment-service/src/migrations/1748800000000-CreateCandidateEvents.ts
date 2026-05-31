import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCandidateEvents1748800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "candidate_events" (
        "id" BIGSERIAL PRIMARY KEY,
        "invitation_id" UUID NOT NULL,
        "user_id" UUID,
        "problem_id" UUID,
        "event_type" VARCHAR(24) NOT NULL,
        "offset_ms" INTEGER NOT NULL,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_candidate_events_invitation_offset"
      ON "candidate_events" ("invitation_id", "offset_ms");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_candidate_events_invitation_type"
      ON "candidate_events" ("invitation_id", "event_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "candidate_events";`);
  }
}
