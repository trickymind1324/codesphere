import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentStatus } from '../entities/assessment.entity';

export class AssessmentProblemDto {
  @IsUUID()
  @IsNotEmpty()
  problemId: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  points?: number;
}

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(15)
  @Max(480)
  @IsOptional()
  durationMinutes?: number;

  @IsEnum(AssessmentStatus)
  @IsOptional()
  status?: AssessmentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentProblemDto)
  @IsOptional()
  problems?: AssessmentProblemDto[];
}
