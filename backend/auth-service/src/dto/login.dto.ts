import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;

  @IsOptional()
  @IsString()
  mfa_code?: string;
}
