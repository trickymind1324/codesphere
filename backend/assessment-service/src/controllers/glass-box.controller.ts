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
import { OptionalAuthGuard } from '../guards/optional-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { GlassBoxService } from '../services/glass-box.service';
import { IngestCandidateEventsDto } from '../dto/candidate-event.dto';

@Controller('glass-box')
export class GlassBoxController {
  constructor(private readonly service: GlassBoxService) {}

  /**
   * Candidate-side ingest. Auth is optional because anti-cheat events
   * are valuable even when the candidate accesses the assessment via an
   * invitation token rather than a full login. The invitation_id in the
   * payload ties events to the assessment session regardless.
   */
  @Post('events')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(@Body() dto: IngestCandidateEventsDto, @Request() req) {
    const userId = req.user?.sub ?? null;
    const inserted = await this.service.ingest(userId, dto);
    return { inserted };
  }

  /**
   * Recruiter view — raw event stream for one invitation.
   */
  @Get('invitations/:invitationId/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'company_admin', 'platform_admin')
  async listEvents(@Param('invitationId', ParseUUIDPipe) invitationId: string) {
    const events = await this.service.list(invitationId);
    return { invitationId, count: events.length, events };
  }

  /**
   * Recruiter view — aggregate summary for the candidate report.
   */
  @Get('invitations/:invitationId/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'company_admin', 'platform_admin')
  async summary(@Param('invitationId', ParseUUIDPipe) invitationId: string) {
    return this.service.summarize(invitationId);
  }
}
