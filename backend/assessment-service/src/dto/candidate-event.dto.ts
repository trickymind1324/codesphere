import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const EVENT_TYPES = [
  'paste',
  'copy',
  'tab_blur',
  'tab_focus',
  'window_blur',
  'window_focus',
  'execution',
  'submission',
] as const;

export class CandidateEventDto {
  @IsInt()
  @Min(0)
  offsetMs: number;

  @IsEnum(EVENT_TYPES)
  eventType: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsUUID()
  problemId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class IngestCandidateEventsDto {
  @IsArray()
  // Bound the batch so a single request can't insert unbounded telemetry rows.
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CandidateEventDto)
  events: CandidateEventDto[];
}
