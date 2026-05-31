import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExecutionService } from '../services/execution.service';
import {
  ExecuteCodeDto,
  ExecuteTestCasesDto,
  TestProblemDto,
  SubmitSolutionDto,
  ExecuteProjectDto,
} from '../dto/execute-code.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('execute')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  /**
   * Execute code with optional stdin (for testing)
   */
  @Post('run')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitSolution(@Body() dto: SubmitSolutionDto, @Request() req) {
    const result = await this.executionService.submitSolution(dto, req.user.sub);
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
