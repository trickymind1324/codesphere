import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  STARTED = 'started',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Entity('assessment_invitations')
export class AssessmentInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'varchar', length: 255 })
  candidateEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  candidateName: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  uniqueToken: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true, comment: 'Total points scored' })
  score: number;

  @Column({ type: 'int', nullable: true, comment: 'Percentage score' })
  percentage: number;

  @Column({ type: 'int', nullable: true, comment: 'Number of problems solved' })
  problemsSolved: number;

  @Column({ type: 'text', nullable: true })
  customMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Assessment, (assessment) => assessment.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessmentId' })
  assessment: Assessment;
}
