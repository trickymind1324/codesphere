import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type CandidateEventType =
  | 'paste'
  | 'copy'
  | 'tab_blur'
  | 'tab_focus'
  | 'window_blur'
  | 'window_focus'
  | 'execution'
  | 'submission';

@Entity('candidate_events')
@Index(['invitationId', 'offsetMs'])
@Index(['invitationId', 'eventType'])
export class CandidateEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'uuid', name: 'invitation_id' })
  invitationId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'problem_id', nullable: true })
  problemId: string | null;

  @Column({ type: 'varchar', length: 24, name: 'event_type' })
  eventType: CandidateEventType;

  @Column({ type: 'integer', name: 'offset_ms' })
  offsetMs: number;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
