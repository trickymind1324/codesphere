import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { ProblemService } from '../services/problem.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { RecordResultDto } from '../dto/record-result.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';
import { InternalKeyGuard } from '../guards/internal-key.guard';

@Controller('assessments')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // Protected routes (require authentication). All are ownership-scoped: the
  // target assessment must belong to the caller (platform_admin exempt).
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvitations(
    @Param('id') assessmentId: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req,
  ) {
    return this.invitationService.createInvitations(
      assessmentId,
      createInvitationDto,
      req.user,
    );
  }

  @Get(':id/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getInvitations(@Param('id') assessmentId: string, @Request() req) {
    return this.invitationService.findByAssessment(assessmentId, req.user);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getResults(@Param('id') assessmentId: string, @Request() req) {
    return this.invitationService.getResults(assessmentId, req.user);
  }

  @Post('invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async resendInvitation(@Param('id') invitationId: string, @Request() req) {
    await this.invitationService.resendInvitation(invitationId, req.user);
    return { message: 'Invitation resent successfully' };
  }
}

// Public routes for candidates (token-based)
@Controller('invitations')
export class PublicInvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly problemService: ProblemService,
  ) {}

  @Get(':token')
  async validateToken(@Param('token') token: string) {
    const invitation = await this.invitationService.findByToken(token);

    // The landing page and assessment IDE need the full problem list
    // (order, points, title, difficulty), not just a count. Titles come
    // from problem-service; if it's unreachable, problem stays undefined
    // and the UI degrades to numbered problems.
    const assessmentProblems = [...(invitation.assessment.assessmentProblems ?? [])]
      .sort((a, b) => a.order - b.order);
    const problemDetails = await this.problemService.getMultipleProblems(
      assessmentProblems.map((ap) => ap.problemId),
    );

    return {
      valid: true,
      assessment: {
        id: invitation.assessment.id,
        title: invitation.assessment.title,
        description: invitation.assessment.description,
        durationMinutes: invitation.assessment.durationMinutes,
        problemCount: assessmentProblems.length,
        assessmentProblems: assessmentProblems.map((ap) => ({
          id: ap.id,
          problemId: ap.problemId,
          order: ap.order,
          points: ap.points,
          problem: problemDetails.get(ap.problemId),
        })),
      },
      invitation: {
        candidateEmail: invitation.candidateEmail,
        candidateName: invitation.candidateName,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        startedAt: invitation.startedAt,
      },
    };
  }

  @Post(':token/start')
  @HttpCode(HttpStatus.OK)
  async startAssessment(@Param('token') token: string) {
    const invitation = await this.invitationService.startAssessment(token);
    return {
      message: 'Assessment started successfully',
      startedAt: invitation.startedAt,
      assessment: invitation.assessment,
    };
  }

  /**
   * Record a per-problem result. Internal only (execution-service) — a
   * candidate cannot call this to inflate their score.
   */
  @Post(':token/results')
  @UseGuards(InternalKeyGuard)
  @HttpCode(HttpStatus.OK)
  async recordResult(
    @Param('token') token: string,
    @Body() dto: RecordResultDto,
  ) {
    await this.invitationService.recordResult(token, dto.problemId, dto.passed);
    return { recorded: true };
  }

  @Post(':token/complete')
  @HttpCode(HttpStatus.OK)
  async completeAssessment(@Param('token') token: string) {
    // Score is recomputed server-side from recorded results; no client input.
    const invitation = await this.invitationService.completeAssessment(token);
    return {
      message: 'Assessment completed successfully',
      score: invitation.score,
      percentage: invitation.percentage,
      problemsSolved: invitation.problemsSolved,
    };
  }
}
