import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  code: string;
}
