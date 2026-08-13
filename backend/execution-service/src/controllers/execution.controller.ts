import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ExecutionService } from '../services/execution.service';
import {
  ExecuteCodeDto,
  ExecuteTestCasesDto,
  TestProblemDto,
  SubmitSolutionDto,
  ExecuteProjectDto,
} from '../dto/execute-code.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AssessmentOrJwtGuard } from '../guards/assessment-or-jwt.guard';

@Controller('execute')
export class ExecutionController {
  private readonly logger = new Logger(ExecutionController.name);

  constructor(
    private readonly executionService: ExecutionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Report a genuine per-problem result to assessment-service so the score is
   * computed there from what actually ran — never from the candidate's browser.
   * Best-effort: a reporting failure must not fail the candidate's submission.
   */
  private async reportAssessmentResult(
    token: string,
    problemId: string,
    passed: boolean,
  ): Promise<void> {
    const url = this.configService.get<string>(
      'ASSESSMENT_SERVICE_URL',
      'http://localhost:8003',
    );
    const key = this.configService.get<string>('INTERNAL_API_KEY', '');
    try {
      await axios.post(
        `${url}/api/v1/invitations/${encodeURIComponent(token)}/results`,
        { problemId, passed },
        { headers: { 'X-Internal-Key': key }, timeout: 5000 },
      );
    } catch (err) {
      this.logger.warn(`Failed to report assessment result: ${err.message}`);
    }
  }

  /**
   * Execute code with optional stdin (for testing)
   */
  @Post('run')
  @UseGuards(AssessmentOrJwtGuard)
  @HttpCode(HttpStatus.OK)
  async executeCode(@Body() dto: ExecuteCodeDto) {
    const result = await this.executionService.executeCode(dto);
    return {
      message: 'Code executed successfully',
      result,
    };
  }

  /**
   * Execute code against problem's example test cases
   */
  @Post('test')
  @UseGuards(AssessmentOrJwtGuard)
  @HttpCode(HttpStatus.OK)
  async testProblem(@Body() dto: TestProblemDto) {
    const result = await this.executionService.testProblem(dto);
    return {
      message: 'Test cases executed successfully',
      result,
    };
  }

  /**
   * Submit solution to a problem
   */
  @Post('submit')
  @UseGuards(AssessmentOrJwtGuard)
  @HttpCode(HttpStatus.OK)
  async submitSolution(@Body() dto: SubmitSolutionDto, @Request() req) {
    // Anonymous assessment candidates have no user record; the solution is
    // evaluated against the full test set but not persisted as a submission
    // (the assessment IDE tracks per-problem results and reports the score
    // to assessment-service on completion).
    const result = await this.executionService.submitSolution(
      dto,
      req.user?.sub ?? null,
    );

    // For a live assessment session, record the genuine result server-side.
    if (req.assessmentToken) {
      await this.reportAssessmentResult(
        req.assessmentToken,
        dto.problemId,
        result.status === 'accepted',
      );
    }

    return {
      message: 'Solution submitted successfully',
      result,
    };
  }

  /**
   * Execute a multi-file project (for debugging problems)
   */
  @Post('project')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async executeProject(@Body() dto: ExecuteProjectDto) {
    const result = await this.executionService.executeProject(dto);
    return {
      message: 'Project executed successfully',
      result,
    };
  }
}
