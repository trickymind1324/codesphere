import { IsEmail, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

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

  @IsEnum(UserRole, { message: 'Invalid role' })
  role: UserRole;
}
