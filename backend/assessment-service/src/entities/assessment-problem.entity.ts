import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';

@Entity('assessment_problems')
export class AssessmentProblem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'uuid', comment: 'References problem.id from problem-service' })
  problemId: string;

  @Column({ type: 'int', comment: 'Order of problem in assessment' })
  order: number;

  @Column({ type: 'int', default: 10, comment: 'Points for solving this problem' })
  points: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Assessment, (assessment) => assessment.assessmentProblems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessmentId' })
  assessment: Assessment;
}
