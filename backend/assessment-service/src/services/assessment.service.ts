import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Assessment, AssessmentStatus } from '../entities/assessment.entity';
import { AssessmentProblem } from '../entities/assessment-problem.entity';
import {
  AssessmentInvitation,
  InvitationStatus,
} from '../entities/assessment-invitation.entity';
import { CreateAssessmentDto } from '../dto/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/update-assessment.dto';
import { ProblemService } from './problem.service';
import { assertAssessmentOwner, Requester } from '../auth/ownership';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentProblem)
    private assessmentProblemRepository: Repository<AssessmentProblem>,
    @InjectRepository(AssessmentInvitation)
    private invitationRepository: Repository<AssessmentInvitation>,
    private problemService: ProblemService,
  ) {}

  async create(
    createAssessmentDto: CreateAssessmentDto,
    userId: string,
  ): Promise<Assessment> {
    const { problems, ...assessmentData } = createAssessmentDto;

    // Create assessment
    const assessment = this.assessmentRepository.create({
      ...assessmentData,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedAssessment = await this.assessmentRepository.save(assessment);

    // Add problems if provided
    if (problems && problems.length > 0) {
      await this.addProblems(savedAssessment.id, problems);
    }

    return this.findOne(savedAssessment.id);
  }

  async findAll(
    userId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    data: Assessment[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const query = this.assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.assessmentProblems', 'problems')
      .orderBy('assessment.createdAt', 'DESC');

    if (userId) {
      query.where('assessment.createdBy = :userId', { userId });
    }

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Fetch problem details for all assessments
    const allProblemIds = new Set<string>();
    data.forEach((assessment) => {
      assessment.assessmentProblems?.forEach((ap) => {
        allProblemIds.add(ap.problemId);
      });
    });

    if (allProblemIds.size > 0) {
      const problemDetails = await this.problemService.getMultipleProblems(
        Array.from(allProblemIds),
      );

      // Attach problem details to each assessment problem
      data.forEach((assessment) => {
        assessment.assessmentProblems?.forEach((ap) => {
          const details = problemDetails.get(ap.problemId);
          if (details) {
            (ap as any).problem = details;
          }
        });
      });
    }

    // Attach live invitation aggregates under the names the dashboard reads
    // (invitationsCount / completedCount / averageScore). Counted from the
    // invitations table rather than the cached counters so the numbers are
    // always right.
    if (data.length > 0) {
      const invitations = await this.invitationRepository.find({
        where: { assessmentId: In(data.map((a) => a.id)) },
        select: ['assessmentId', 'status', 'percentage'],
      });
      const byAssessment = new Map<
        string,
        { invited: number; completed: number; scoreSum: number; scoreCount: number }
      >();
      for (const inv of invitations) {
        let agg = byAssessment.get(inv.assessmentId);
        if (!agg) {
          agg = { invited: 0, completed: 0, scoreSum: 0, scoreCount: 0 };
          byAssessment.set(inv.assessmentId, agg);
        }
        agg.invited++;
        if (inv.status === InvitationStatus.COMPLETED) {
          agg.completed++;
          if (inv.percentage != null) {
            agg.scoreSum += inv.percentage;
            agg.scoreCount++;
          }
        }
      }
      data.forEach((assessment) => {
        const agg = byAssessment.get(assessment.id);
        (assessment as any).invitationsCount = agg?.invited ?? 0;
        (assessment as any).completedCount = agg?.completed ?? 0;
        (assessment as any).averageScore = agg?.scoreCount
          ? Math.round((agg.scoreSum / agg.scoreCount) * 10) / 10
          : null;
      });
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Lightweight ownership gate for recruiter-facing routes: verifies the
   * assessment exists and belongs to the requester (platform_admin exempt)
   * without loading relations.
   */
  async assertOwner(assessmentId: string, user: Requester): Promise<void> {
    const row = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
      select: ['id', 'createdBy'],
    });
    if (!row) {
      throw new NotFoundException(`Assessment with ID ${assessmentId} not found`);
    }
    assertAssessmentOwner(row.createdBy, user);
  }

  async findOne(id: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['assessmentProblems', 'invitations'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    // Fetch problem details from problem service
    if (assessment.assessmentProblems?.length > 0) {
      const problemIds = assessment.assessmentProblems.map((ap) => ap.problemId);
      const problemDetails = await this.problemService.getMultipleProblems(problemIds);

      // Attach problem details to each assessment problem
      assessment.assessmentProblems.forEach((ap) => {
        const details = problemDetails.get(ap.problemId);
        if (details) {
          (ap as any).problem = details;
        }
      });
    }

    return assessment;
  }

  async update(
    id: string,
    updateAssessmentDto: UpdateAssessmentDto,
    userId: string,
  ): Promise<Assessment> {
    const assessment = await this.findOne(id);

    const { problems, ...updateData } = updateAssessmentDto;

    // Update assessment fields
    Object.assign(assessment, {
      ...updateData,
      updatedBy: userId,
    });

    await this.assessmentRepository.save(assessment);

    // Update problems if provided
    if (problems !== undefined) {
      // Remove existing problems
      await this.assessmentProblemRepository.delete({ assessmentId: id });

      // Add new problems
      if (problems.length > 0) {
        await this.addProblems(id, problems);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const assessment = await this.findOne(id);
    await this.assessmentRepository.softDelete(id);
  }

  async addProblems(
    assessmentId: string,
    problems: Array<{ problemId: string; order: number; points?: number }>,
  ): Promise<void> {
    const assessmentProblems = problems.map((problem) =>
      this.assessmentProblemRepository.create({
        assessmentId,
        problemId: problem.problemId,
        order: problem.order,
        points: problem.points || 10,
      }),
    );

    await this.assessmentProblemRepository.save(assessmentProblems);
  }

  async removeProblem(assessmentId: string, problemId: string): Promise<void> {
    const result = await this.assessmentProblemRepository.delete({
      assessmentId,
      problemId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Problem not found in this assessment');
    }
  }

  async updateStatus(
    id: string,
    status: AssessmentStatus,
    userId: string,
  ): Promise<Assessment> {
    const assessment = await this.findOne(id);
    assessment.status = status;
    assessment.updatedBy = userId;
    await this.assessmentRepository.save(assessment);
    return this.findOne(id);
  }

  async getStatistics(assessmentId: string) {
    const assessment = await this.findOne(assessmentId);

    // Compute live from the invitations table (field names match what the
    // frontend AssessmentStatistics type expects).
    const invitations = await this.invitationRepository.find({
      where: { assessmentId },
      select: ['status', 'percentage', 'startedAt', 'completedAt'],
    });

    const completed = invitations.filter(
      (i) => i.status === InvitationStatus.COMPLETED,
    );
    const scored = completed.filter((i) => i.percentage != null);
    const timed = completed.filter((i) => i.startedAt && i.completedAt);

    const round1 = (n: number) => Math.round(n * 10) / 10;

    return {
      totalInvitations: invitations.length,
      completedCount: completed.length,
      startedCount: invitations.filter(
        (i) => i.status === InvitationStatus.STARTED,
      ).length,
      pendingCount: invitations.filter(
        (i) => i.status === InvitationStatus.PENDING,
      ).length,
      averageScore: scored.length
        ? round1(
            scored.reduce((sum, i) => sum + (i.percentage as number), 0) /
              scored.length,
          )
        : 0,
      averageCompletionTime: timed.length
        ? Math.round(
            timed.reduce(
              (sum, i) =>
                sum +
                (new Date(i.completedAt).getTime() -
                  new Date(i.startedAt).getTime()) /
                  60000,
              0,
            ) / timed.length,
          )
        : 0,
      completionRate: invitations.length
        ? round1((completed.length / invitations.length) * 100)
        : 0,
      totalProblems: assessment.assessmentProblems?.length || 0,
      totalPoints: assessment.assessmentProblems?.reduce(
        (sum, ap) => sum + ap.points,
        0,
      ) || 0,
    };
  }

  /**
   * Aggregate hiring activity for a single recruiter, scoped strictly to the
   * assessments they own (`createdBy = userId`). Returns headline totals plus a
   * per-quarter breakdown. There is no "hire" outcome or structured job-role in
   * the data yet, so grouping is by quarter only (role grouping is future work).
   */
  async getRecruiterStats(userId: string) {
    // Own, non-deleted assessments only. Query builder avoids loading the eager
    // problem relation and automatically excludes soft-deleted rows.
    const assessments = await this.assessmentRepository
      .createQueryBuilder('a')
      .select(['a.id', 'a.status', 'a.createdAt', 'a.jobRole'])
      .where('a.createdBy = :userId', { userId })
      .getMany();

    const byStatus: Record<string, number> = {
      draft: 0,
      published: 0,
      archived: 0,
    };
    for (const a of assessments) {
      if (a.status in byStatus) byStatus[a.status]++;
    }

    const assessmentIds = assessments.map((a) => a.id);
    const invitations = assessmentIds.length
      ? await this.invitationRepository
          .createQueryBuilder('i')
          .select([
            'i.assessmentId',
            'i.status',
            'i.percentage',
            'i.createdAt',
            'i.completedAt',
          ])
          .where('i.assessmentId IN (:...ids)', { ids: assessmentIds })
          .getMany()
      : [];

    const completedInvites = invitations.filter(
      (i) => i.status === InvitationStatus.COMPLETED,
    );
    const candidatesInvited = invitations.length;
    const candidatesCompleted = completedInvites.length;
    const completionRate = candidatesInvited
      ? (candidatesCompleted / candidatesInvited) * 100
      : 0;

    const scored = completedInvites.filter((i) => i.percentage != null);
    const averageScorePercent = scored.length
      ? scored.reduce((sum, i) => sum + (i.percentage as number), 0) /
        scored.length
      : null;

    // Per-quarter buckets: assessments/invitations by createdAt, completions by
    // completedAt (with the score collected where the invitation carries one).
    const buckets = new Map<
      string,
      {
        quarter: string;
        assessmentsCreated: number;
        invited: number;
        completed: number;
        scoreSum: number;
        scoreCount: number;
      }
    >();
    const bucketFor = (d: Date) => {
      const label = this.quarterLabel(d);
      let b = buckets.get(label);
      if (!b) {
        b = {
          quarter: label,
          assessmentsCreated: 0,
          invited: 0,
          completed: 0,
          scoreSum: 0,
          scoreCount: 0,
        };
        buckets.set(label, b);
      }
      return b;
    };

    for (const a of assessments) bucketFor(a.createdAt).assessmentsCreated++;
    for (const i of invitations) {
      bucketFor(i.createdAt).invited++;
      if (i.status === InvitationStatus.COMPLETED && i.completedAt) {
        const b = bucketFor(i.completedAt);
        b.completed++;
        if (i.percentage != null) {
          b.scoreSum += i.percentage;
          b.scoreCount++;
        }
      }
    }

    // Keep the most recent 8 quarters that saw any activity, oldest first.
    const byQuarter = Array.from(buckets.values())
      .sort((x, y) => this.quarterSortKey(x.quarter) - this.quarterSortKey(y.quarter))
      .slice(-8)
      .map((b) => ({
        quarter: b.quarter,
        assessmentsCreated: b.assessmentsCreated,
        invited: b.invited,
        completed: b.completed,
        averageScorePercent: b.scoreCount
          ? this.round1(b.scoreSum / b.scoreCount)
          : null,
      }));

    // Per-role buckets, keyed by each assessment's jobRole (assessments
    // without one land under "Unspecified"). Invitations inherit the role of
    // their parent assessment.
    const roleOfAssessment = new Map<string, string>(
      assessments.map((a) => [a.id, a.jobRole?.trim() || 'Unspecified']),
    );
    const roleBuckets = new Map<
      string,
      {
        role: string;
        assessmentsCreated: number;
        invited: number;
        completed: number;
        scoreSum: number;
        scoreCount: number;
      }
    >();
    const roleBucketFor = (role: string) => {
      let b = roleBuckets.get(role);
      if (!b) {
        b = {
          role,
          assessmentsCreated: 0,
          invited: 0,
          completed: 0,
          scoreSum: 0,
          scoreCount: 0,
        };
        roleBuckets.set(role, b);
      }
      return b;
    };

    for (const a of assessments) {
      roleBucketFor(roleOfAssessment.get(a.id)!).assessmentsCreated++;
    }
    for (const i of invitations) {
      const b = roleBucketFor(
        roleOfAssessment.get(i.assessmentId) ?? 'Unspecified',
      );
      b.invited++;
      if (i.status === InvitationStatus.COMPLETED) {
        b.completed++;
        if (i.percentage != null) {
          b.scoreSum += i.percentage;
          b.scoreCount++;
        }
      }
    }

    // Most active roles first; "Unspecified" always last.
    const byRole = Array.from(roleBuckets.values())
      .sort((x, y) => {
        if (x.role === 'Unspecified') return 1;
        if (y.role === 'Unspecified') return -1;
        return y.invited - x.invited || y.assessmentsCreated - x.assessmentsCreated;
      })
      .map((b) => ({
        role: b.role,
        assessmentsCreated: b.assessmentsCreated,
        invited: b.invited,
        completed: b.completed,
        averageScorePercent: b.scoreCount
          ? this.round1(b.scoreSum / b.scoreCount)
          : null,
      }));

    return {
      totals: {
        assessmentsCreated: assessments.length,
        byStatus,
        candidatesInvited,
        candidatesCompleted,
        completionRate: this.round1(completionRate),
        averageScorePercent:
          averageScorePercent != null ? this.round1(averageScorePercent) : null,
      },
      byQuarter,
      byRole,
    };
  }

  private quarterLabel(d: Date): string {
    const date = new Date(d);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${date.getFullYear()}-Q${quarter}`;
  }

  private quarterSortKey(label: string): number {
    const [year, q] = label.split('-Q');
    return Number(year) * 4 + (Number(q) - 1);
  }

  private round1(n: number): number {
    return Math.round(n * 10) / 10;
  }
}
