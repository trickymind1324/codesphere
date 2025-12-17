import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  SetMetadata,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProblemService } from '../services/problem.service';
import { CreateProblemDto } from '../dto/create-problem.dto';
import { UpdateProblemDto } from '../dto/update-problem.dto';
import { QueryProblemsDto } from '../dto/query-problems.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  /**
   * Create a new problem (admin/recruiter only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'company_admin', 'platform_admin')
  async create(@Body() createProblemDto: CreateProblemDto, @Request() req) {
    const problem = await this.problemService.create(createProblemDto, req.user.sub);
    return {
      message: 'Problem created successfully',
      problem,
    };
  }

  /**
   * Get all problems with filters
   */
  @Get()
  async findAll(@Query() queryDto: QueryProblemsDto) {
    return this.problemService.findAll(queryDto);
  }

  /**
   * Get a single problem by ID or slug
   */
  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.problemService.findOne(idOrSlug);
  }

  /**
   * Update a problem (admin/recruiter only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'company_admin', 'platform_admin')
  async update(
    @Param('id') id: string,
    @Body() updateProblemDto: UpdateProblemDto,
    @Request() req,
  ) {
    const problem = await this.problemService.update(id, updateProblemDto, req.user.sub);
    return {
      message: 'Problem updated successfully',
      problem,
    };
  }

  /**
   * Delete a problem (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'platform_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.problemService.remove(id);
  }

  /**
   * Get test cases for a problem
   */
  @Get(':id/test-cases')
  @UseGuards(OptionalAuthGuard)
  async getTestCases(@Param('id') id: string, @Request() req) {
    // Only show hidden test cases to admins/recruiters or internal service requests
    const includeHidden =
      req.isInternalRequest ||
      (req.user && ['recruiter', 'company_admin', 'platform_admin'].includes(req.user.role));
    return this.problemService.getTestCases(id, includeHidden);
  }
}
