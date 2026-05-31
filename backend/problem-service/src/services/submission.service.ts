import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../entities/submission.entity';
import { Problem } from '../entities/problem.entity';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { QuerySubmissionsDto } from '../dto/query-submissions.dto';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Problem)
    private problemRepository: Repository<Problem>,
  ) {}

  /**
   * Create a new submission
   */
  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    // Verify problem exists
    const problem = await this.problemRepository.findOne({
      where: { id: createSubmissionDto.problemId },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with ID ${createSubmissionDto.problemId} not found`);
    }

    // Create submission
    const submission = this.submissionRepository.create(createSubmissionDto);
    const savedSubmission = await this.submissionRepository.save(submission);

    // Update problem statistics
    await this.updateProblemStatistics(createSubmissionDto.problemId, createSubmissionDto.status);

    return savedSubmission;
  }

  /**
   * Find all submissions with filters and pagination
   */
  async findAll(queryDto: QuerySubmissionsDto): Promise<{
    data: Submission[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      pageSize = 20,
      userId,
      problemId,
      status,
      language,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    // Build query
    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.problem', 'problem');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('submission.userId = :userId', { userId });
    }

    if (problemId) {
      queryBuilder.andWhere('submission.problemId = :problemId', { problemId });
    }

    if (status) {
      queryBuilder.andWhere('submission.status = :status', { status });
    }

    if (language) {
      queryBuilder.andWhere('submission.language = :language', { language });
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply sorting
    queryBuilder.orderBy(`submission.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // Apply pagination
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    // Execute query
    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find one submission by ID
   */
  async findOne(id: string, userId?: string): Promise<Submission> {
    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.problem', 'problem')
      .where('submission.id = :id', { id });

    if (userId) {
      queryBuilder.andWhere('submission.userId = :userId', { userId });
    }

    const submission = await queryBuilder.getOne();

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  /**
   * Get user statistics for a specific problem
   */
  async getUserProblemStats(userId: string, problemId: string): Promise<{
    totalAttempts: number;
    acceptedAttempts: number;
    bestExecutionTime: number | null;
    bestMemoryUsage: number | null;
    languages: string[];
  }> {
    const submissions = await this.submissionRepository.find({
      where: { userId, problemId },
      order: { createdAt: 'DESC' },
    });

    const acceptedSubmissions = submissions.filter((s) => s.status === 'accepted');
    const languages = [...new Set(submissions.map((s) => s.language))];

    const bestExecutionTime = acceptedSubmissions.length > 0
      ? Math.min(...acceptedSubmissions.map((s) => s.executionTimeMs || Infinity))
      : null;

    const bestMemoryUsage = acceptedSubmissions.length > 0
      ? Math.min(...acceptedSubmissions.map((s) => s.memoryUsageKb || Infinity))
      : null;

    return {
      totalAttempts: submissions.length,
      acceptedAttempts: acceptedSubmissions.length,
      bestExecutionTime: bestExecutionTime === Infinity ? null : bestExecutionTime,
      bestMemoryUsage: bestMemoryUsage === Infinity ? null : bestMemoryUsage,
      languages,
    };
  }

  /**
   * Get user overall statistics
   */
  async getUserStats(userId: string): Promise<{
    totalSubmissions: number;
    acceptedSubmissions: number;
    problemsSolved: number;
    languagesUsed: string[];
    recentActivity: { date: string; count: number }[];
  }> {
    const submissions = await this.submissionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const acceptedSubmissions = submissions.filter((s) => s.status === 'accepted');
    const problemsSolved = new Set(acceptedSubmissions.map((s) => s.problemId)).size;
    const languagesUsed = [...new Set(submissions.map((s) => s.language))];

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = submissions.filter(
      (s) => new Date(s.createdAt) >= thirtyDaysAgo,
    );

    // Group by date
    const activityMap = new Map<string, number>();
    recentSubmissions.forEach((submission) => {
      const date = new Date(submission.createdAt).toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    const recentActivity = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSubmissions: submissions.length,
      acceptedSubmissions: acceptedSubmissions.length,
      problemsSolved,
      languagesUsed,
      recentActivity,
    };
  }

  /**
   * Update problem statistics after a submission
   */
  private async updateProblemStatistics(
    problemId: string,
    status: string,
  ): Promise<void> {
    const problem = await this.problemRepository.findOne({
      where: { id: problemId },
    });

    if (!problem) {
      return;
    }

    problem.totalSubmissions += 1;
    if (status === 'accepted') {
      problem.totalAccepted += 1;
    }

    // Calculate acceptance rate
    if (problem.totalSubmissions > 0) {
      problem.acceptanceRate = parseFloat(
        ((problem.totalAccepted / problem.totalSubmissions) * 100).toFixed(2),
      );
    }

    await this.problemRepository.save(problem);
  }
}
