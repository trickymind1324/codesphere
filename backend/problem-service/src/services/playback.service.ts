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

  async getSession(sessionId: string, userId: string): Promise<PlaybackEvent[]> {
    return this.repo.find({
      where: { sessionId, userId },
      order: { offsetMs: 'ASC' },
    });
  }
}
