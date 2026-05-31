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
import { ProgrammingLanguage } from './starter-code.entity';

@Entity('problem_files')
@Index(['problemId', 'language', 'filePath'], { unique: true })
export class ProblemFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  problemId: string;

  @ManyToOne(() => Problem, (problem) => problem.problemFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'problemId' })
  problem: Problem;

  @Column({
    type: 'enum',
    enum: ProgrammingLanguage,
  })
  language: ProgrammingLanguage;

  @Column()
  filePath: string; // e.g., "src/parser.py", "config.json"

  @Column('text')
  content: string;

  @Column({ default: false })
  isEntryPoint: boolean; // Mark the main file to execute

  @Column({ default: false })
  isReadOnly: boolean; // Files user cannot edit (e.g., test files)

  @Column({ default: 0 })
  order: number; // Display order in file tree

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
