import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

@Controller('assessments')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // Protected routes (require authentication)
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvitations(
    @Param('id') assessmentId: string,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return this.invitationService.createInvitations(
      assessmentId,
      createInvitationDto,
    );
  }

  @Get(':id/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getInvitations(@Param('id') assessmentId: string) {
    return this.invitationService.findByAssessment(assessmentId);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getResults(@Param('id') assessmentId: string) {
    return this.invitationService.getResults(assessmentId);
  }

  @Post('invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async resendInvitation(@Param('id') invitationId: string) {
    await this.invitationService.resendInvitation(invitationId);
    return { message: 'Invitation resent successfully' };
  }
}

// Public routes for candidates (token-based)
@Controller('invitations')
export class PublicInvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get(':token')
  async validateToken(@Param('token') token: string) {
    const invitation = await this.invitationService.findByToken(token);
    return {
      valid: true,
      assessment: {
        id: invitation.assessment.id,
        title: invitation.assessment.title,
        description: invitation.assessment.description,
        durationMinutes: invitation.assessment.durationMinutes,
        problemCount: invitation.assessment.assessmentProblems?.length || 0,
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

  @Post(':token/complete')
  @HttpCode(HttpStatus.OK)
  async completeAssessment(
    @Param('token') token: string,
    @Body() body: { score: number; problemsSolved: number; totalPoints: number },
  ) {
    const invitation = await this.invitationService.completeAssessment(
      token,
      body.score,
      body.problemsSolved,
      body.totalPoints,
    );
    return {
      message: 'Assessment completed successfully',
      score: invitation.score,
      percentage: invitation.percentage,
      problemsSolved: invitation.problemsSolved,
    };
  }
}
