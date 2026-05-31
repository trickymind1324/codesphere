import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PlaybackService } from '../services/playback.service';
import { IngestPlaybackBatchDto } from '../dto/playback.dto';

@Controller('playback')
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(private readonly service: PlaybackService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(@Body() dto: IngestPlaybackBatchDto, @Request() req) {
    const inserted = await this.service.ingest(req.user.sub, dto);
    return { inserted };
  }

  @Get('sessions/:sessionId')
  async getSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req,
  ) {
    const events = await this.service.getSession(sessionId, req.user.sub);
    return { sessionId, count: events.length, events };
  }
}
