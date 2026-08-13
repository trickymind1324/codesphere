import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserProfiles1755700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "userId" varchar(64) NOT NULL,
        "displayName" varchar(120),
        "headline" varchar(160),
        "bio" text,
        "college" varchar(160),
        "location" varchar(120),
        "githubUrl" varchar(200),
        "linkedinUrl" varchar(200),
        "websiteUrl" varchar(200),
        "experience" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("userId")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
  }
}
