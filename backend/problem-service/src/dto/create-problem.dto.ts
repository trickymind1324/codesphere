import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProblemDifficulty, ProblemStatus, ProblemType } from '../entities/problem.entity';
import { ProgrammingLanguage } from '../entities/starter-code.entity';
import { ValidationType } from '../entities/test-case.entity';

export class ExampleDto {
  @IsString()
  input: string;

  @IsString()
  output: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class TestCaseDto {
  @IsString()
  input: string;

  @IsString()
  expectedOutput: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsBoolean()
  isExample?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsEnum(ValidationType)
  validationType?: ValidationType;
}

export class ExecutionConfigDto {
  @IsString()
  entryCommand: string;

  @IsOptional()
  @IsString()
  workingDirectory?: string;
}

export class ProblemFileDto {
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @IsString()
  filePath: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isEntryPoint?: boolean;

  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

export class StarterCodeDto {
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  functionName?: string;
}

export class CreateProblemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(ProblemDifficulty)
  difficulty: ProblemDifficulty;

  @IsOptional()
  @IsEnum(ProblemStatus)
  status?: ProblemStatus;

  @IsOptional()
  @IsEnum(ProblemType)
  problemType?: ProblemType;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExecutionConfigDto)
  executionConfig?: ExecutionConfigDto;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  examples?: ExampleDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companies?: string[];

  @IsOptional()
  @IsString()
  timeComplexity?: string;

  @IsOptional()
  @IsString()
  spaceComplexity?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(30000)
  timeLimitMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(1024)
  memoryLimitMb?: number;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  @ArrayMinSize(1)
  testCases: TestCaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StarterCodeDto)
  starterCodes?: StarterCodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemFileDto)
  problemFiles?: ProblemFileDto[];
}
