import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlaybackEvents1748700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "playback_events" (
        "id" BIGSERIAL PRIMARY KEY,
        "session_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "problem_id" UUID,
        "language" VARCHAR(20) NOT NULL,
        "event_type" VARCHAR(16) NOT NULL,
        "offset_ms" INTEGER NOT NULL,
        "payload" JSONB NOT NULL,
        "recorded_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_playback_events_session_offset"
      ON "playback_events" ("session_id", "offset_ms");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_playback_events_user_problem"
      ON "playback_events" ("user_id", "problem_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "playback_events";`);
  }
}
