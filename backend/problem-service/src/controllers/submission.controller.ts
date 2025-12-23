import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubmissionService } from '../services/submission.service';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { QuerySubmissionsDto } from '../dto/query-submissions.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  /**
   * Create a new submission (internal service call or authenticated user)
   */
  @Post()
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSubmissionDto: CreateSubmissionDto, @Request() req) {
    // If not an internal request, verify userId matches authenticated user
    if (!req.isInternalRequest && req.user) {
      createSubmissionDto.userId = req.user.sub;
    }

    const submission = await this.submissionService.create(createSubmissionDto);
    return {
      message: 'Submission created successfully',
      submission,
    };
  }

  /**
   * Get all submissions with filters (authenticated users see their own, internal service sees all)
   */
  @Get()
  @UseGuards(OptionalAuthGuard)
  async findAll(@Query() queryDto: QuerySubmissionsDto, @Request() req) {
    // If not an internal request, filter by authenticated user
    if (!req.isInternalRequest && req.user) {
      queryDto.userId = req.user.sub;
    }

    return this.submissionService.findAll(queryDto);
  }

  /**
   * Get a single submission by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    // Users can only see their own submissions
    const userId = req.user.sub;
    return this.submissionService.findOne(id, userId);
  }

  /**
   * Get user statistics for a specific problem
   */
  @Get('stats/problem/:problemId')
  @UseGuards(JwtAuthGuard)
  async getUserProblemStats(@Param('problemId') problemId: string, @Request() req) {
    const userId = req.user.sub;
    return this.submissionService.getUserProblemStats(userId, problemId);
  }

  /**
   * Get user overall statistics
   */
  @Get('stats/user')
  @UseGuards(JwtAuthGuard)
  async getUserStats(@Request() req) {
    const userId = req.user.sub;
    return this.submissionService.getUserStats(userId);
  }
}
