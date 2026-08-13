import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A per-problem result for one candidate's assessment session, written only by
 * execution-service after it actually runs the tests. The final score is
 * recomputed from these rows, so the candidate's browser can no longer report
 * its own score. One row per (invitation, problem); the best attempt wins.
 */
@Entity('assessment_results')
@Unique(['invitationId', 'problemId'])
export class AssessmentResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invitationId: string;

  @Column({ type: 'uuid', comment: 'References problem.id from problem-service' })
  problemId: string;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ type: 'int', default: 0, comment: 'Points awarded for this problem' })
  pointsAwarded: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
