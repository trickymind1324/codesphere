import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlaybackEvent } from '../entities/playback-event.entity';
import { IngestPlaybackBatchDto } from '../dto/playback.dto';

@Injectable()
export class PlaybackService {
  constructor(
    @InjectRepository(PlaybackEvent)
    private readonly repo: Repository<PlaybackEvent>,
  ) {}

  async ingest(userId: string, batch: IngestPlaybackBatchDto): Promise<number> {
    if (batch.events.length === 0) return 0;
    const rows = batch.events.map((e) =>
      this.repo.create({
        sessionId: batch.sessionId,
        userId,
        problemId: batch.problemId ?? null,
        language: batch.language,
        eventType: e.eventType,
        offsetMs: e.offsetMs,
        payload: e.payload,
      }),
    );
    await this.repo.insert(rows);
    return rows.length;
  }

  /**
   * Fetch a session's event stream. The recording user can always replay
   * their own sessions; recruiter-side roles may replay any session (e.g. a
   * candidate sharing a playback link with a recruiter reviewing them).
   * Ingest stays owner-only — this widens reads, never writes.
   */
  async getSession(
    sessionId: string,
    user: { sub: string; role?: string },
  ): Promise<PlaybackEvent[]> {
    const isReviewer = ['recruiter', 'company_admin', 'platform_admin'].includes(
      user.role ?? '',
    );
    return this.repo.find({
      where: isReviewer ? { sessionId } : { sessionId, userId: user.sub },
      order: { offsetMs: 'ASC' },
    });
  }
}
