import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  CANDIDATE = 'candidate',
  RECRUITER = 'recruiter',
  COMPANY_ADMIN = 'company_admin',
  PLATFORM_ADMIN = 'platform_admin',
}

export enum UserTier {
  FREE = 'free',
  PRO = 'pro',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CANDIDATE,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserTier,
    default: UserTier.FREE,
  })
  tier: UserTier;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  email_verification_token: string;

  @Column({ type: 'timestamp', nullable: true })
  email_verification_expires: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  password_reset_token: string;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires: Date;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mfa_secret: string;

  @Column({ type: 'jsonb', nullable: true })
  mfa_backup_codes: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  oauth_provider: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  oauth_id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  account_locked_until: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_login_ip: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
