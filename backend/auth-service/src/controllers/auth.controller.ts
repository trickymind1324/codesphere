import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KeycloakAdminService } from '../services/keycloak-admin.service';
import { RegisterDto } from '../dto/register.dto';

/**
 * Keycloak is the identity provider: it owns login, token refresh, logout,
 * password reset, email verification, MFA, and identity brokering. The only
 * responsibility left here is a first-party registration proxy that creates
 * the account in Keycloak, so the app keeps its own sign-up form.
 */
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly keycloakAdmin: KeycloakAdminService) {}

  /**
   * POST /api/v1/auth/keycloak/register
   * Create the user in Keycloak; the SPA then logs in via the password grant.
   * Candidate role is applied by the realm default.
   */
  @Post('keycloak/register')
  @HttpCode(HttpStatus.CREATED)
  async keycloakRegister(@Body() registerDto: RegisterDto) {
    await this.keycloakAdmin.createUser({
      email: registerDto.email,
      password: registerDto.password,
      fullName: (registerDto as { full_name?: string }).full_name || registerDto.email,
    });
    return { message: 'Account created' };
  }
}
