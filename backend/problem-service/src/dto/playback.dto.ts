import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const EVENT_TYPES = ['edit', 'run', 'submit', 'cursor'] as const;

export class PlaybackEventDto {
  @IsInt()
  @Min(0)
  offsetMs: number;

  @IsEnum(EVENT_TYPES)
  eventType: (typeof EVENT_TYPES)[number];

  @IsObject()
  payload: Record<string, unknown>;
}

export class IngestPlaybackBatchDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsUUID()
  problemId?: string;

  @IsString()
  language: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaybackEventDto)
  events: PlaybackEventDto[];
}
