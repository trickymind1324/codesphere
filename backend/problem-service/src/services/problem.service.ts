import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, IsNull } from 'typeorm';
import { Problem } from '../entities/problem.entity';
import { TestCase } from '../entities/test-case.entity';
import { Tag } from '../entities/tag.entity';
import { StarterCode } from '../entities/starter-code.entity';
import { CreateProblemDto } from '../dto/create-problem.dto';
import { UpdateProblemDto } from '../dto/update-problem.dto';
import { QueryProblemsDto } from '../dto/query-problems.dto';

@Injectable()
export class ProblemService {
  constructor(
    @InjectRepository(Problem)
    private problemRepository: Repository<Problem>,
    @InjectRepository(TestCase)
    private testCaseRepository: Repository<TestCase>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(StarterCode)
    private starterCodeRepository: Repository<StarterCode>,
  ) {}

  /**
   * Create a new problem
   */
  async create(createProblemDto: CreateProblemDto, userId: string): Promise<Problem> {
    // Generate slug from title
    const slug = this.generateSlug(createProblemDto.title);

    // Check if slug already exists
    const existingProblem = await this.problemRepository.findOne({
      where: { slug },
    });

    if (existingProblem) {
      throw new ConflictException('A problem with this title already exists');
    }

    // Get or create tags
    const tags = await this.getOrCreateTags(createProblemDto.tags);

    // Create problem
    const problem = this.problemRepository.create({
      ...createProblemDto,
      slug,
      createdBy: userId,
      updatedBy: userId,
      tags,
    });

    // Save problem first to get the ID
    const savedProblem = await this.problemRepository.save(problem);

    // Create test cases
    if (createProblemDto.testCases && createProblemDto.testCases.length > 0) {
      const testCases = createProblemDto.testCases.map((tc, index) =>
        this.testCaseRepository.create({
          ...tc,
          problemId: savedProblem.id,
          order: tc.order ?? index,
        }),
      );
      await this.testCaseRepository.save(testCases);
    }

    // Create starter codes
    if (createProblemDto.starterCodes && createProblemDto.starterCodes.length > 0) {
      const starterCodes = createProblemDto.starterCodes.map((sc) =>
        this.starterCodeRepository.create({
          ...sc,
          problemId: savedProblem.id,
        }),
      );
      await this.starterCodeRepository.save(starterCodes);
    }

    // Update tag problem counts
    await this.updateTagCounts(tags);

    // Return problem with relations
    return this.findOne(savedProblem.id);
  }

  /**
   * Find all problems with filters and pagination
   */
  async findAll(queryDto: QueryProblemsDto): Promise<{
    data: Problem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, pageSize = 20, search, difficulty, status, isPremium, tags, companies, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const queryBuilder = this.problemRepository
      .createQueryBuilder('problem')
      .leftJoinAndSelect('problem.tags', 'tag')
      .leftJoinAndSelect('problem.starterCodes', 'starterCode')
      .where('problem.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(problem.title ILIKE :search OR problem.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (difficulty) {
      queryBuilder.andWhere('problem.difficulty = :difficulty', { difficulty });
    }

    if (status) {
      queryBuilder.andWhere('problem.status = :status', { status });
    }

    if (isPremium !== undefined) {
      queryBuilder.andWhere('problem.isPremium = :isPremium', { isPremium });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('tag.slug IN (:...tags)', { tags });
    }

    if (companies && companies.length > 0) {
      queryBuilder.andWhere('problem.companies && :companies', { companies });
    }

    // Apply sorting
    queryBuilder.orderBy(`problem.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find one problem by ID or slug
   */
  async findOne(idOrSlug: string): Promise<Problem> {
    const problem = await this.problemRepository.findOne({
      where: [
        { id: idOrSlug, deletedAt: IsNull() },
        { slug: idOrSlug, deletedAt: IsNull() },
      ],
      relations: ['tags', 'testCases', 'starterCodes'],
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    return problem;
  }

  /**
   * Update a problem
   */
  async update(
    id: string,
    updateProblemDto: UpdateProblemDto,
    userId: string,
  ): Promise<Problem> {
    const problem = await this.findOne(id);

    // Update slug if title changed
    if (updateProblemDto.title && updateProblemDto.title !== problem.title) {
      const newSlug = this.generateSlug(updateProblemDto.title);
      const existingProblem = await this.problemRepository.findOne({
        where: { slug: newSlug },
      });

      if (existingProblem && existingProblem.id !== id) {
        throw new ConflictException('A problem with this title already exists');
      }

      updateProblemDto['slug'] = newSlug;
    }

    // Update tags if provided
    if (updateProblemDto.tags) {
      const oldTags = problem.tags;
      const newTags = await this.getOrCreateTags(updateProblemDto.tags);
      problem.tags = newTags;

      // Update tag counts
      await this.updateTagCounts(oldTags, -1);
      await this.updateTagCounts(newTags, 1);
    }

    // Update test cases if provided
    if (updateProblemDto.testCases) {
      // Delete old test cases
      await this.testCaseRepository.delete({ problemId: id });

      // Create new test cases
      const testCases = updateProblemDto.testCases.map((tc, index) =>
        this.testCaseRepository.create({
          ...tc,
          problemId: id,
          order: tc.order ?? index,
        }),
      );
      await this.testCaseRepository.save(testCases);
    }

    // Update starter codes if provided
    if (updateProblemDto.starterCodes) {
      // Delete old starter codes
      await this.starterCodeRepository.delete({ problemId: id });

      // Create new starter codes
      const starterCodes = updateProblemDto.starterCodes.map((sc) =>
        this.starterCodeRepository.create({
          ...sc,
          problemId: id,
        }),
      );
      await this.starterCodeRepository.save(starterCodes);
    }

    // Update problem
    Object.assign(problem, {
      ...updateProblemDto,
      updatedBy: userId,
    });

    await this.problemRepository.save(problem);

    return this.findOne(id);
  }

  /**
   * Soft delete a problem
   */
  async remove(id: string): Promise<void> {
    const problem = await this.findOne(id);

    // Update tag counts
    await this.updateTagCounts(problem.tags, -1);

    // Soft delete
    problem.deletedAt = new Date();
    await this.problemRepository.save(problem);
  }

  /**
   * Get problem test cases (excluding hidden ones for non-admin users)
   */
  async getTestCases(id: string, includeHidden: boolean = false): Promise<TestCase[]> {
    const problem = await this.findOne(id);

    const query: any = { problemId: problem.id };
    if (!includeHidden) {
      query.isHidden = false;
    }

    return this.testCaseRepository.find({
      where: query,
      order: { order: 'ASC' },
    });
  }

  /**
   * Update problem statistics
   */
  async updateStatistics(
    id: string,
    accepted: boolean,
  ): Promise<void> {
    const problem = await this.findOne(id);

    problem.totalSubmissions += 1;
    if (accepted) {
      problem.totalAccepted += 1;
    }

    // Calculate acceptance rate
    problem.acceptanceRate = parseFloat(
      ((problem.totalAccepted / problem.totalSubmissions) * 100).toFixed(2),
    );

    await this.problemRepository.save(problem);
  }

  /**
   * Helper: Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Get or create tags
   */
  private async getOrCreateTags(tagSlugs: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const slug of tagSlugs) {
      let tag = await this.tagRepository.findOne({ where: { slug } });

      if (!tag) {
        // Create new tag with name as capitalized slug
        const name = slug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        tag = this.tagRepository.create({ slug, name });
        tag = await this.tagRepository.save(tag);
      }

      tags.push(tag);
    }

    return tags;
  }

  /**
   * Helper: Update tag problem counts
   */
  private async updateTagCounts(tags: Tag[], delta: number = 1): Promise<void> {
    for (const tag of tags) {
      tag.problemCount = Math.max(0, (tag.problemCount || 0) + delta);
      await this.tagRepository.save(tag);
    }
  }
}
