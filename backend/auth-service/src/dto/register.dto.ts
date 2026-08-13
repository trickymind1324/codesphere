import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Full name must not exceed 255 characters' })
  full_name: string;

  // Accepted from the sign-up form but ignored: self-registrations always get
  // the candidate role from the realm default (no self-granted recruiter).
  @IsOptional()
  @IsIn(['candidate', 'recruiter'])
  role?: string;
}
