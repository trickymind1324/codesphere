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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssessmentService } from '../services/assessment.service';
import { CreateAssessmentDto } from '../dto/create-assessment.dto';
import { UpdateAssessmentDto } from '../dto/update-assessment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AssessmentStatus } from '../entities/assessment.entity';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAssessmentDto: CreateAssessmentDto,
    @Request() req,
  ) {
    return this.assessmentService.create(createAssessmentDto, req.user.sub);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    // If user is recruiter/admin, show their assessments
    // If platform admin, show all
    const userId = req.user.role === 'platform_admin' ? undefined : req.user.sub;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.assessmentService.findAll(userId, pageNum, pageSizeNum);
  }

  // Recruiter's own aggregated hiring stats. Declared before `:id` so the
  // static path is never captured by the id param. Scoped to req.user.sub.
  @Get('recruiter/me/stats')
  async getRecruiterStats(@Request() req) {
    return this.assessmentService.getRecruiterStats(req.user.sub);
  }

  // Every per-assessment route below is ownership-scoped: the assessment must
  // belong to the caller (createdBy = sub); platform_admin is exempt.

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    await this.assessmentService.assertOwner(id, req.user);
    return this.assessmentService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Request() req,
  ) {
    await this.assessmentService.assertOwner(id, req.user);
    return this.assessmentService.update(id, updateAssessmentDto, req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    await this.assessmentService.assertOwner(id, req.user);
    await this.assessmentService.remove(id);
  }

  @Post(':id/problems')
  @HttpCode(HttpStatus.CREATED)
  async addProblems(
    @Param('id') id: string,
    @Body() body: { problems: Array<{ problemId: string; order: number; points?: number }> },
    @Request() req,
  ) {
    await this.assessmentService.assertOwner(id, req.user);
    await this.assessmentService.addProblems(id, body.problems);
    return this.assessmentService.findOne(id);
  }

  @Delete(':id/problems/:problemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProblem(
    @Param('id') id: string,
    @Param('problemId') problemId: string,
    @Request() req,
  ) {
    await this.assessmentService.assertOwner(id, req.user);
    await this.assessmentService.removeProblem(id, problemId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AssessmentStatus },
    @Request() req,
  ) {
    await this.assessmentService.assertOwner(id, req.user);
    return this.assessmentService.updateStatus(id, body.status, req.user.sub);
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string, @Request() req) {
    await this.assessmentService.assertOwner(id, req.user);
    return this.assessmentService.getStatistics(id);
  }
}
