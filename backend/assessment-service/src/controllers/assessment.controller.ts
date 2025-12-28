import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
    return this.assessmentService.create(createAssessmentDto, req.user.userId);
  }

  @Get()
  async findAll(@Request() req) {
    // If user is recruiter/admin, show their assessments
    // If platform admin, show all
    const userId = req.user.role === 'platform_admin' ? undefined : req.user.userId;
    return this.assessmentService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assessmentService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Request() req,
  ) {
    return this.assessmentService.update(id, updateAssessmentDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.assessmentService.remove(id);
  }

  @Post(':id/problems')
  @HttpCode(HttpStatus.CREATED)
  async addProblems(
    @Param('id') id: string,
    @Body() body: { problems: Array<{ problemId: string; order: number; points?: number }> },
  ) {
    await this.assessmentService.addProblems(id, body.problems);
    return this.assessmentService.findOne(id);
  }

  @Delete(':id/problems/:problemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProblem(
    @Param('id') id: string,
    @Param('problemId') problemId: string,
  ) {
    await this.assessmentService.removeProblem(id, problemId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AssessmentStatus },
    @Request() req,
  ) {
    return this.assessmentService.updateStatus(id, body.status, req.user.userId);
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return this.assessmentService.getStatistics(id);
  }
}
