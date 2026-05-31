import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateEvent } from '../entities/candidate-event.entity';
import { IngestCandidateEventsDto } from '../dto/candidate-event.dto';

export interface GlassBoxSummary {
  invitationId: string;
  totalEvents: number;
  countsByType: Record<string, number>;
  longestTabBlurMs: number | null;
  pasteCount: number;
  pasteTotalChars: number;
}

@Injectable()
export class GlassBoxService {
  constructor(
    @InjectRepository(CandidateEvent)
    private readonly repo: Repository<CandidateEvent>,
  ) {}

  async ingest(userId: string | null, batch: IngestCandidateEventsDto): Promise<number> {
    if (batch.events.length === 0) return 0;
    const rows = batch.events.map((e) =>
      this.repo.create({
        invitationId: batch.invitationId,
        userId,
        problemId: e.problemId ?? null,
        eventType: e.eventType,
        offsetMs: e.offsetMs,
        metadata: e.metadata ?? {},
      }),
    );
    await this.repo.insert(rows);
    return rows.length;
  }

  async list(invitationId: string): Promise<CandidateEvent[]> {
    return this.repo.find({
      where: { invitationId },
      order: { offsetMs: 'ASC' },
    });
  }

  async summarize(invitationId: string): Promise<GlassBoxSummary> {
    const events = await this.list(invitationId);

    const countsByType: Record<string, number> = {};
    let pasteCount = 0;
    let pasteTotalChars = 0;
    let longestTabBlurMs: number | null = null;
    let lastBlurOffset: number | null = null;

    for (const e of events) {
      countsByType[e.eventType] = (countsByType[e.eventType] ?? 0) + 1;

      if (e.eventType === 'paste') {
        pasteCount += 1;
        const len = Number((e.metadata as { textLength?: number })?.textLength ?? 0);
        if (Number.isFinite(len)) pasteTotalChars += len;
      }

      if (e.eventType === 'tab_blur') {
        lastBlurOffset = e.offsetMs;
      } else if (e.eventType === 'tab_focus' && lastBlurOffset !== null) {
        const dur = e.offsetMs - lastBlurOffset;
        if (longestTabBlurMs === null || dur > longestTabBlurMs) {
          longestTabBlurMs = dur;
        }
        lastBlurOffset = null;
      }
    }

    return {
      invitationId,
      totalEvents: events.length,
      countsByType,
      longestTabBlurMs,
      pasteCount,
      pasteTotalChars,
    };
  }
}
