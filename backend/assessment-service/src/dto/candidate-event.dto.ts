import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
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
  @IsUUID()
  invitationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateEventDto)
  events: CandidateEventDto[];
}
