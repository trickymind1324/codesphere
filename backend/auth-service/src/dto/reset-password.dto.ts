import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @IsString()
  @MinLength(12, { message: 'Password confirmation must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password confirmation must not exceed 128 characters' })
  confirm_password: string;
}
