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
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { EmailService } from './email.service';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(AssessmentInvitation)
    private invitationRepository: Repository<AssessmentInvitation>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    private emailService: EmailService,
  ) {}

  async createInvitations(
    assessmentId: string,
    createInvitationDto: CreateInvitationDto,
  ): Promise<AssessmentInvitation[]> {
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

  async findByAssessment(assessmentId: string): Promise<AssessmentInvitation[]> {
    return this.invitationRepository.find({
      where: { assessmentId },
      order: { createdAt: 'DESC' },
    });
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

  async completeAssessment(
    token: string,
    score: number,
    problemsSolved: number,
    totalPoints: number,
  ): Promise<AssessmentInvitation> {
    const invitation = await this.findByToken(token);

    if (invitation.status === InvitationStatus.COMPLETED) {
      throw new BadRequestException('Assessment already completed');
    }

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

  async getResults(assessmentId: string): Promise<any[]> {
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

  async resendInvitation(invitationId: string): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['assessment', 'assessment.assessmentProblems'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

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
