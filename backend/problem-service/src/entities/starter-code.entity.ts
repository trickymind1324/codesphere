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

export enum ProgrammingLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JAVA = 'java',
  CPP = 'cpp',
  C = 'c',
  GO = 'go',
  RUST = 'rust',
  CSHARP = 'csharp',
  RUBY = 'ruby',
  PHP = 'php',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  SQL = 'sql',
}

@Entity('starter_codes')
@Index(['problemId', 'language'], { unique: true })
export class StarterCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  problemId: string;

  @ManyToOne(() => Problem, (problem) => problem.starterCodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'problemId' })
  problem: Problem;

  @Column({
    type: 'enum',
    enum: ProgrammingLanguage,
  })
  language: ProgrammingLanguage;

  @Column('text')
  code: string;

  // Function signature or entry point
  @Column({ nullable: true })
  functionName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
