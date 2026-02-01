import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { TestCase } from './test-case.entity';
import { Tag } from './tag.entity';
import { StarterCode } from './starter-code.entity';
import { ProblemFile } from './problem-file.entity';

export enum ProblemDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ProblemStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ProblemType {
  ALGORITHMIC = 'algorithmic',
  DEBUGGING = 'debugging',
}

export interface ExecutionConfig {
  entryCommand: string; // e.g., "python main.py"
  workingDirectory?: string;
}

@Entity('problems')
@Index(['status', 'difficulty'])
@Index(['slug'], { unique: true })
export class Problem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  @Index()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProblemDifficulty,
    default: ProblemDifficulty.EASY,
  })
  @Index()
  difficulty: ProblemDifficulty;

  @Column({
    type: 'enum',
    enum: ProblemStatus,
    default: ProblemStatus.DRAFT,
  })
  @Index()
  status: ProblemStatus;

  // Problem type: algorithmic (single-file) or debugging (multi-file)
  @Column({
    type: 'enum',
    enum: ProblemType,
    default: ProblemType.ALGORITHMIC,
  })
  @Index()
  problemType: ProblemType;

  // Execution configuration for debugging problems
  @Column('jsonb', { nullable: true })
  executionConfig: ExecutionConfig;

  // Premium content flag
  @Column({ default: false })
  isPremium: boolean;

  // Problem metadata
  @Column('text', { array: true, default: '{}' })
  hints: string[];

  @Column('jsonb', { nullable: true })
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];

  @Column('text', { array: true, default: '{}' })
  constraints: string[];

  @Column('text', { array: true, default: '{}' })
  companies: string[];

  // Statistics
  @Column({ default: 0 })
  totalSubmissions: number;

  @Column({ default: 0 })
  totalAccepted: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  acceptanceRate: number;

  // Time and space complexity (expected)
  @Column({ nullable: true })
  timeComplexity: string;

  @Column({ nullable: true })
  spaceComplexity: string;

  // Resource limits for execution
  @Column({ default: 2000 }) // milliseconds
  timeLimitMs: number;

  @Column({ default: 128 }) // megabytes
  memoryLimitMb: number;

  // Relations
  @OneToMany(() => TestCase, (testCase) => testCase.problem, {
    cascade: true,
    eager: false,
  })
  testCases: TestCase[];

  @ManyToMany(() => Tag, (tag) => tag.problems, {
    cascade: false,
    eager: true,
  })
  @JoinTable({
    name: 'problem_tags',
    joinColumn: { name: 'problem_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => StarterCode, (starterCode) => starterCode.problem, {
    cascade: true,
    eager: true,
  })
  starterCodes: StarterCode[];

  // Problem files for debugging problems (multi-file)
  @OneToMany(() => ProblemFile, (problemFile) => problemFile.problem, {
    cascade: true,
    eager: false,
  })
  problemFiles: ProblemFile[];

  // Audit fields
  @Column({ nullable: true })
  createdBy: string; // User ID from auth service

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete
  @Column({ nullable: true })
  deletedAt: Date;
}
