import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Problem } from './problem.entity';

export enum ValidationType {
  EXACT = 'exact', // stdout.trim() === expectedOutput.trim()
  CONTAINS = 'contains', // stdout.includes(expectedOutput)
  REGEX = 'regex', // new RegExp(expectedOutput).test(stdout)
  EXIT_CODE = 'exit_code', // exitCode === parseInt(expectedOutput)
}

@Entity('test_cases')
@Index(['problemId', 'isHidden'])
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  problemId: string;

  @ManyToOne(() => Problem, (problem) => problem.testCases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'problemId' })
  problem: Problem;

  // Test case data
  @Column('text')
  input: string;

  @Column('text')
  expectedOutput: string;

  @Column('text', { nullable: true })
  explanation: string;

  // Whether this test case is shown to users
  @Column({ default: false })
  isExample: boolean;

  // Hidden test cases for validation
  @Column({ default: false })
  isHidden: boolean;

  // Order for display
  @Column({ default: 0 })
  order: number;

  // For weighted scoring
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  // Validation type for debugging problems
  @Column({
    type: 'enum',
    enum: ValidationType,
    default: ValidationType.EXACT,
  })
  validationType: ValidationType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
