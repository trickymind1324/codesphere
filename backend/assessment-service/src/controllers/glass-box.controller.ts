import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { GlassBoxService } from '../services/glass-box.service';
import { InvitationService } from '../services/invitation.service';
import { IngestCandidateEventsDto } from '../dto/candidate-event.dto';

@Controller('glass-box')
export class GlassBoxController {
  constructor(
    private readonly service: GlassBoxService,
    private readonly invitations: InvitationService,
  ) {}

  /**
   * Candidate-side ingest. The invitation token in the URL is the auth —
   * possession of the token proves the caller is operating within the
   * candidate's assessment session. The token resolves server-side to an
   * invitation_id, which the events are bound to; the client never names
   * the invitation_id directly.
   *
   * Rejects unless the invitation is in the STARTED state (i.e. between
   * POST /invitations/:token/start and POST /invitations/:token/complete).
   */
  @Post('invitations/:token/events')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(
    @Param('token') token: string,
    @Body() dto: IngestCandidateEventsDto,
  ) {
    const invitation = await this.invitations.findStartedByToken(token);
    const inserted = await this.service.ingestForInvitation(invitation.id, dto);
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
