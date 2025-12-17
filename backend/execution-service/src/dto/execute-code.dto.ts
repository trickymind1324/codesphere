import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProgrammingLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JAVA = 'java',
  CPP = 'cpp',
  C = 'c',
  GO = 'go',
}

export class TestCaseInput {
  @IsString()
  input: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;
}

export class ExecuteCodeDto {
  @IsString()
  code: string;

  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @IsOptional()
  @IsString()
  stdin?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(30000)
  timeLimitMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(512)
  memoryLimitMb?: number;
}

export class ExecuteTestCasesDto {
  @IsString()
  code: string;

  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseInput)
  testCases: TestCaseInput[];

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(30000)
  timeLimitMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(512)
  memoryLimitMb?: number;
}

export class TestProblemDto {
  @IsString()
  problemId: string;

  @IsString()
  code: string;

  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;
}

export class SubmitSolutionDto {
  @IsString()
  problemId: string;

  @IsString()
  code: string;

  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;
}
