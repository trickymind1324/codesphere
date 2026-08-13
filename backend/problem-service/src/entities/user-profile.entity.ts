import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ExperienceItem {
  company: string;
  role: string;
  from?: string;
  to?: string;
  description?: string;
}

/**
 * A candidate's public/shareable profile. Keyed by the Keycloak user id
 * (`sub`). Identity (name/email) comes from the token; this stores the
 * self-authored fields. Progress stats are computed from submissions, not
 * stored here.
 */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  headline: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  college: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  githubUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  linkedinUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  websiteUrl: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  experience: ExperienceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
