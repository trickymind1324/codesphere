import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyMfaDto } from '../dto/verify-mfa.dto';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { GithubOAuthGuard } from '../guards/github-oauth.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const result = await this.authService.login(loginDto, ipAddress);

      // Extract primitive values to avoid any circular references
      const refreshToken = String(result.tokens.refreshToken);
      const accessToken = String(result.tokens.accessToken);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: loginDto.remember_me ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
      });

      // Create completely clean response object
      const responseData = JSON.parse(JSON.stringify({
        user: result.user,
        accessToken: accessToken,
      }));

      res.status(HttpStatus.OK).json(responseData);
    } catch (error) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Refresh token not found',
      });
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: tokens.accessToken,
    };
  }

  /**
   * POST /api/v1/auth/logout
   * Logout and invalidate refresh token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  /**
   * GET /api/v1/auth/verify-email
   * Verify email with token
   */
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Resend verification email
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return await this.authService.resendVerificationEmail(email);
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset link
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
      resetPasswordDto.confirm_password
    );
  }

  /**
   * POST /api/v1/auth/change-password
   * Change password (authenticated user)
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body('current_password') currentPassword: string,
    @Body('new_password') newPassword: string,
    @Body('confirm_password') confirmPassword: string,
    @Req() req: Request
  ) {
    // TODO: Extract user ID from JWT token using guard
    // For now, this is a placeholder
    const userId = req['user']?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return await this.authService.changePassword(
      userId,
      currentPassword,
      newPassword,
      confirmPassword
    );
  }

  /**
   * GET /api/v1/auth/oauth/google
   * Redirect to Google OAuth
   */
  @Get('oauth/google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * GET /api/v1/auth/oauth/google/callback
   * Google OAuth callback
   */
  @Get('oauth/google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const oauthUser = req.user as any;

    const result = await this.authService.oauthLogin({
      oauthId: oauthUser.oauthId,
      email: oauthUser.email,
      fullName: oauthUser.fullName,
      avatarUrl: oauthUser.avatarUrl,
      provider: 'google',
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with access token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.tokens.accessToken}&isNewUser=${result.isNewUser}`;
    return res.redirect(redirectUrl);
  }

  /**
   * GET /api/v1/auth/oauth/github
   * Redirect to GitHub OAuth
   */
  @Get('oauth/github')
  @UseGuards(GithubOAuthGuard)
  async githubAuth() {
    // Guard redirects to GitHub
  }

  /**
   * GET /api/v1/auth/oauth/github/callback
   * GitHub OAuth callback
   */
  @Get('oauth/github/callback')
  @UseGuards(GithubOAuthGuard)
  async githubAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const oauthUser = req.user as any;

    const result = await this.authService.oauthLogin({
      oauthId: oauthUser.oauthId,
      email: oauthUser.email,
      fullName: oauthUser.fullName,
      avatarUrl: oauthUser.avatarUrl,
      provider: 'github',
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with access token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.tokens.accessToken}&isNewUser=${result.isNewUser}`;
    return res.redirect(redirectUrl);
  }

  /**
   * POST /api/v1/auth/mfa/setup
   * Setup MFA for authenticated user
   */
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  async setupMfa(@Req() req: Request) {
    // TODO: Extract user ID from JWT token using guard
    const userId = req['user']?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return await this.authService.setupMfa(userId);
  }

  /**
   * POST /api/v1/auth/mfa/verify
   * Verify and enable MFA
   */
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body() verifyMfaDto: VerifyMfaDto,
    @Req() req: Request
  ) {
    const userId = req['user']?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return await this.authService.verifyAndEnableMfa(userId, verifyMfaDto.code);
  }

  /**
   * POST /api/v1/auth/mfa/disable
   * Disable MFA
   */
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  async disableMfa(
    @Body('password') password: string,
    @Body('code') code: string,
    @Req() req: Request
  ) {
    const userId = req['user']?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return await this.authService.disableMfa(userId, password, code);
  }

  /**
   * GET /api/v1/auth/me
   * Get current user (requires authentication)
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Req() req: Request) {
    // TODO: Implement JWT guard and extract user from token
    // Will implement in next iteration
    return { message: 'Authentication required' };
  }
}
