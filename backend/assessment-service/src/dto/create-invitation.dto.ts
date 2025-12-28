import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvitationCandidateDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateInvitationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvitationCandidateDto)
  candidates: InvitationCandidateDto[];

  @IsString()
  @IsOptional()
  customMessage?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  expiryDays?: number;
}
