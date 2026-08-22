import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
  AssessmentInvitation,
  InvitationStatus,
} from '../entities/assessment-invitation.entity';
import { Assessment } from '../entities/assessment.entity';
import { AssessmentResult } from '../entities/assessment-result.entity';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { EmailService } from './email.service';
import { assertAssessmentOwner, Requester } from '../auth/ownership';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(AssessmentInvitation)
    private invitationRepository: Repository<AssessmentInvitation>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentResult)
    private resultRepository: Repository<AssessmentResult>,
    private emailService: EmailService,
  ) {}

  /**
   * Record a per-problem result for a live assessment session. Called only by
   * execution-service (behind an internal key), which is the only component
   * that actually runs the tests. Stores the best attempt per problem: points
   * come from the assessment's own configuration, never from the caller.
   */
  async recordResult(
    token: string,
    problemId: string,
    passed: boolean,
  ): Promise<void> {
    const invitation = await this.findStartedByToken(token);
    const assessmentProblem = (invitation.assessment.assessmentProblems ?? []).find(
      (ap) => ap.problemId === problemId,
    );
    if (!assessmentProblem) {
      throw new BadRequestException('Problem is not part of this assessment');
    }
    const pointsAwarded = passed ? assessmentProblem.points : 0;

    const existing = await this.resultRepository.findOne({
      where: { invitationId: invitation.id, problemId },
    });
    if (!existing) {
      await this.resultRepository.save(
        this.resultRepository.create({
          invitationId: invitation.id,
          problemId,
          passed,
          pointsAwarded,
        }),
      );
      return;
    }
    // Keep the best attempt — never downgrade a previously-passed problem.
    if (pointsAwarded > existing.pointsAwarded || (passed && !existing.passed)) {
      existing.passed = passed || existing.passed;
      existing.pointsAwarded = Math.max(existing.pointsAwarded, pointsAwarded);
      await this.resultRepository.save(existing);
    }
  }

  /**
   * Ownership gate shared by the recruiter-facing methods: the assessment
   * must exist and belong to the requester (platform_admin exempt).
   */
  private async assertOwner(assessmentId: string, user: Requester): Promise<void> {
    const row = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
      select: ['id', 'createdBy'],
    });
    if (!row) {
      throw new NotFoundException(`Assessment with ID ${assessmentId} not found`);
    }
    assertAssessmentOwner(row.createdBy, user);
  }

  async createInvitations(
    assessmentId: string,
    createInvitationDto: CreateInvitationDto,
    user: Requester,
  ): Promise<AssessmentInvitation[]> {
    await this.assertOwner(assessmentId, user);
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
      relations: ['assessmentProblems'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${assessmentId} not found`);
    }

    const { candidates, customMessage, expiresAt, expiryDays } = createInvitationDto;

    // Calculate expiry date
    const expiryDate = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000);

    const invitations: AssessmentInvitation[] = [];

    for (const candidate of candidates) {
      // Generate unique token
      const token = this.generateToken();

      // Create invitation
      const invitation = this.invitationRepository.create({
        assessmentId,
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        uniqueToken: token,
        expiresAt: expiryDate,
        customMessage,
      });

      const savedInvitation = await this.invitationRepository.save(invitation);
      invitations.push(savedInvitation);

      // Send email
      try {
        await this.emailService.sendInvitation(
          candidate.email,
          candidate.name || candidate.email,
          assessment,
          token,
          customMessage,
          expiryDate,
        );
      } catch (error) {
        console.error(`Failed to send email to ${candidate.email}:`, error);
        // Continue with other invitations even if one fails
      }
    }

    // Update assessment invitation count
    await this.assessmentRepository.update(assessmentId, {
      totalInvitations: assessment.totalInvitations + candidates.length,
    });

    return invitations;
  }

  async findByAssessment(
    assessmentId: string,
    user: Requester,
  ): Promise<AssessmentInvitation[]> {
    await this.assertOwner(assessmentId, user);
    return this.invitationRepository.find({
      where: { assessmentId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Load an invitation with its parent assessment and verify the requester
   * owns that assessment. Used by recruiter views keyed by invitation id
   * (glass-box events/summary).
   */
  async findOwnedById(
    invitationId: string,
    user: Requester,
  ): Promise<AssessmentInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['assessment'],
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${invitationId} not found`);
    }
    assertAssessmentOwner(invitation.assessment?.createdBy, user);
    return invitation;
  }

  async findByToken(token: string): Promise<AssessmentInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { uniqueToken: token },
      relations: ['assessment', 'assessment.assessmentProblems'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      if (invitation.status === InvitationStatus.PENDING) {
        invitation.status = InvitationStatus.EXPIRED;
        await this.invitationRepository.save(invitation);
      }
      throw new BadRequestException('This invitation has expired');
    }

    // Check if already completed
    if (invitation.status === InvitationStatus.COMPLETED) {
      throw new BadRequestException('This assessment has already been completed');
    }

    return invitation;
  }

  async findStartedByToken(token: string): Promise<AssessmentInvitation> {
    const invitation = await this.findByToken(token);
    if (invitation.status !== InvitationStatus.STARTED) {
      throw new BadRequestException(
        'Assessment must be started before sending events',
      );
    }
    return invitation;
  }

  async startAssessment(token: string): Promise<AssessmentInvitation> {
    const invitation = await this.findByToken(token);

    if (invitation.status === InvitationStatus.STARTED) {
      // Already started, return current state
      return invitation;
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Cannot start this assessment');
    }

    invitation.status = InvitationStatus.STARTED;
    invitation.startedAt = new Date();

    return this.invitationRepository.save(invitation);
  }

  async completeAssessment(token: string): Promise<AssessmentInvitation> {
    const invitation = await this.findByToken(token);

    if (invitation.status === InvitationStatus.COMPLETED) {
      throw new BadRequestException('Assessment already completed');
    }

    // Recompute the score server-side from the recorded per-problem results —
    // the candidate's browser is never trusted for the score.
    const results = await this.resultRepository.find({
      where: { invitationId: invitation.id },
    });
    const problems = invitation.assessment.assessmentProblems ?? [];
    const totalPoints = problems.reduce((sum, p) => sum + p.points, 0);
    const score = results.reduce((sum, r) => sum + r.pointsAwarded, 0);
    const problemsSolved = results.filter((r) => r.passed).length;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    invitation.status = InvitationStatus.COMPLETED;
    invitation.completedAt = new Date();
    invitation.score = score;
    invitation.percentage = percentage;
    invitation.problemsSolved = problemsSolved;

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Update assessment completed count
    const assessment = await this.assessmentRepository.findOne({
      where: { id: invitation.assessmentId },
    });

    if (assessment) {
      await this.assessmentRepository.update(invitation.assessmentId, {
        completedSubmissions: assessment.completedSubmissions + 1,
      });
    }

    // Send completion email
    try {
      await this.emailService.sendAssessmentCompleted(
        invitation.candidateEmail,
        invitation.candidateName || invitation.candidateEmail,
        invitation.assessment,
        score,
        percentage,
      );
    } catch (error) {
      console.error('Failed to send completion email:', error);
    }

    return savedInvitation;
  }

  async getResults(assessmentId: string, user: Requester): Promise<any[]> {
    await this.assertOwner(assessmentId, user);
    const invitations = await this.invitationRepository.find({
      where: { assessmentId },
      order: { percentage: 'DESC', completedAt: 'ASC' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      candidateEmail: inv.candidateEmail,
      candidateName: inv.candidateName,
      status: inv.status,
      score: inv.score,
      percentage: inv.percentage,
      problemsSolved: inv.problemsSolved,
      startedAt: inv.startedAt,
      completedAt: inv.completedAt,
      createdAt: inv.createdAt,
    }));
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async resendInvitation(invitationId: string, user: Requester): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['assessment', 'assessment.assessmentProblems'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    assertAssessmentOwner(invitation.assessment?.createdBy, user);

    if (invitation.status === InvitationStatus.COMPLETED) {
      throw new BadRequestException('Cannot resend completed invitation');
    }

    // Update expiry if needed
    if (new Date() > invitation.expiresAt) {
      const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      invitation.expiresAt = newExpiryDate;
      invitation.status = InvitationStatus.PENDING;
      await this.invitationRepository.save(invitation);
    }

    await this.emailService.sendInvitation(
      invitation.candidateEmail,
      invitation.candidateName || invitation.candidateEmail,
      invitation.assessment,
      invitation.uniqueToken,
      invitation.customMessage,
      invitation.expiresAt,
    );
  }
}
