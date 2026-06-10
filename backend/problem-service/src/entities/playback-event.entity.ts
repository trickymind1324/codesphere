import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PlaybackEventType = 'edit' | 'run' | 'submit' | 'cursor';

@Entity('playback_events')
@Index(['sessionId', 'offsetMs'])
export class PlaybackEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'uuid', name: 'session_id' })
  sessionId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'problem_id', nullable: true })
  problemId: string | null;

  @Column({ type: 'varchar', length: 20 })
  language: string;

  @Column({ type: 'varchar', length: 16, name: 'event_type' })
  eventType: PlaybackEventType;

  @Column({ type: 'integer', name: 'offset_ms' })
  offsetMs: number;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}
