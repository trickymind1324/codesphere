import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileMedia1755800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
        ADD COLUMN "avatarUrl" text,
        ADD COLUMN "skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN "resumeData" text,
        ADD COLUMN "resumeName" varchar(200);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
        DROP COLUMN IF EXISTS "avatarUrl",
        DROP COLUMN IF EXISTS "skills",
        DROP COLUMN IF EXISTS "resumeData",
        DROP COLUMN IF EXISTS "resumeName";
    `);
  }
}
