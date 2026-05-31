import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AssessmentProblem } from './assessment-problem.entity';
import { AssessmentInvitation } from './assessment-invitation.entity';

export enum AssessmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 120, comment: 'Duration in minutes' })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.DRAFT,
  })
  status: AssessmentStatus;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'int', default: 0 })
  totalInvitations: number;

  @Column({ type: 'int', default: 0 })
  completedSubmissions: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => AssessmentProblem, (ap) => ap.assessment, {
    cascade: true,
    eager: true,
  })
  assessmentProblems: AssessmentProblem[];

  @OneToMany(() => AssessmentInvitation, (invitation) => invitation.assessment)
  invitations: AssessmentInvitation[];
}
