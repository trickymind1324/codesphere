import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, AssessmentStatus } from '../entities/assessment.entity';
import { AssessmentProblem } from '../entities/assessment-problem.entity';
import { CreateAssessmentDto } from '../dto/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/update-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentProblem)
    private assessmentProblemRepository: Repository<AssessmentProblem>,
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

  async findAll(userId?: string): Promise<Assessment[]> {
    const query = this.assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.assessmentProblems', 'problems')
      .orderBy('assessment.createdAt', 'DESC');

    if (userId) {
      query.where('assessment.createdBy = :userId', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['assessmentProblems', 'invitations'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
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

    return {
      totalInvitations: assessment.totalInvitations,
      completedSubmissions: assessment.completedSubmissions,
      completionRate:
        assessment.totalInvitations > 0
          ? (assessment.completedSubmissions / assessment.totalInvitations) * 100
          : 0,
      totalProblems: assessment.assessmentProblems?.length || 0,
      totalPoints: assessment.assessmentProblems?.reduce(
        (sum, ap) => sum + ap.points,
        0,
      ) || 0,
    };
  }
}
