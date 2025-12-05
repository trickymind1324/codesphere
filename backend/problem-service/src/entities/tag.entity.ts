import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Problem } from './problem.entity';

@Entity('tags')
@Index(['slug'], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  // Category for grouping tags (e.g., 'algorithm', 'data-structure', 'topic')
  @Column({ nullable: true })
  category: string;

  // Number of problems with this tag
  @Column({ default: 0 })
  problemCount: number;

  @ManyToMany(() => Problem, (problem) => problem.tags)
  problems: Problem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
