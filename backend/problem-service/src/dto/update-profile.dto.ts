import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExperienceItemDto {
  @IsString()
  @MaxLength(120)
  company: string;

  @IsString()
  @MaxLength(120)
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(160)
  headline?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  bio?: string;

  @IsOptional() @IsString() @MaxLength(160)
  college?: string;

  @IsOptional() @IsString() @MaxLength(120)
  location?: string;

  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(200)
  githubUrl?: string;

  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(200)
  linkedinUrl?: string;

  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(200)
  websiteUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experience?: ExperienceItemDto[];
}
