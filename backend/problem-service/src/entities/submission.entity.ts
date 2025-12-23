import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Problem } from './problem.entity';

export enum SubmissionStatus {
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  RUNTIME_ERROR = 'runtime_error',
  COMPILATION_ERROR = 'compilation_error',
  INTERNAL_ERROR = 'internal_error',
}

export enum ProgrammingLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JAVA = 'java',
  CPP = 'cpp',
  C = 'c',
  GO = 'go',
}

@Entity('submissions')
@Index(['userId', 'createdAt'])
@Index(['problemId', 'status'])
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  problemId: string;

  @ManyToOne(() => Problem, { eager: false })
  @JoinColumn({ name: 'problemId' })
  problem: Problem;

  @Column('text')
  code: string;

  @Column({
    type: 'enum',
    enum: ProgrammingLanguage,
  })
  language: ProgrammingLanguage;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
  })
  @Index()
  status: SubmissionStatus;

  // Test execution results
  @Column({ type: 'int', default: 0 })
  totalTestCases: number;

  @Column({ type: 'int', default: 0 })
  passedTestCases: number;

  @Column({ type: 'int', default: 0 })
  failedTestCases: number;

  // Performance metrics
  @Column({ type: 'int', nullable: true })
  executionTimeMs: number;

  @Column({ type: 'int', nullable: true })
  memoryUsageKb: number;

  // Detailed test results (optional, for debugging)
  @Column('jsonb', { nullable: true })
  testResults: {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTimeMs: number;
    error?: string;
  }[];

  @Column('text', { nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}
