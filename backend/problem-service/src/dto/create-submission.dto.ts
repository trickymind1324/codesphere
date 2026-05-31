import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { SubmissionStatus, ProgrammingLanguage } from '../entities/submission.entity';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  problemId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @IsNotEmpty()
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTestCases?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passedTestCases?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  failedTestCases?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  executionTimeMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  memoryUsageKb?: number;

  @IsOptional()
  @IsArray()
  testResults?: {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTimeMs: number;
    error?: string;
  }[];

  @IsOptional()
  @IsString()
  error?: string;
}
