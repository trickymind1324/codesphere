import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { hashPassword, verifyPassword, generateEmailVerificationToken, generatePasswordResetToken, isAccountLocked, calculateLockTime } from '../utils/crypto.util';
import { JwtService, TokenPair } from '../utils/jwt.util';
import { generateMfaSecret, generateMfaQrCode, verifyMfaCode, generateBackupCodes, hashBackupCodes, verifyBackupCode } from '../utils/mfa.util';
import { RedisService } from './redis.service';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private jwtService: JwtService;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {
    this.jwtService = new JwtService();
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; message: string }> {
    const { email, password, full_name, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Hash password using Argon2id
    const password_hash = await hashPassword(password);

    // Generate email verification token
    const { token: emailVerificationToken, expires: emailVerificationExpires } = generateEmailVerificationToken();

    // Create user
    const user = this.userRepository.create({
      email,
      password_hash,
      full_name,
      role,
      email_verification_token: emailVerificationToken,
      email_verification_expires: emailVerificationExpires,
    });

    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(email, full_name, emailVerificationToken);

    // Remove sensitive data before returning
    const { password_hash: _, email_verification_token, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto, ipAddress: string): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const { email, password, remember_me, mfa_code } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (isAccountLocked(user.failed_login_attempts, user.account_locked_until)) {
      throw new UnauthorizedException(
        `Account is locked due to multiple failed login attempts. Please try again after ${user.account_locked_until?.toLocaleString()}`
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      // Increment failed attempts
      user.failed_login_attempts += 1;

      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 5) {
        user.account_locked_until = calculateLockTime();
        await this.userRepository.save(user);
        throw new UnauthorizedException('Account locked due to multiple failed login attempts. Try again in 15 minutes.');
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!mfa_code) {
        throw new UnauthorizedException('MFA code required');
      }

      // Verify MFA code (TOTP or backup code)
      const isMfaValid = await this.verifyMfaLogin(user.id, mfa_code);
      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed login attempts
    user.failed_login_attempts = 0;
    user.account_locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = ipAddress;
    await this.userRepository.save(user);

    // Generate JWT tokens
    const tokens = this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.tier,
      remember_me || false
    );

    // Store refresh token in Redis with user session info
    await this.redisService.storeRefreshToken(user.id, tokens.refreshToken, remember_me ? 30 : 7);

    // Remove sensitive data
    const { password_hash, mfa_secret, email_verification_token, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verifyToken(refreshToken);

      // Check if token is blacklisted in Redis
      const isBlacklisted = await this.redisService.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Get user from database
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new token pair
      const newTokens = this.jwtService.generateTokenPair(
        user.id,
        user.email,
        user.role,
        user.tier,
        false
      );

      // Blacklist old refresh token (token rotation)
      await this.redisService.blacklistToken(refreshToken);

      // Store new refresh token
      await this.redisService.storeRefreshToken(user.id, newTokens.refreshToken, 7);

      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user (blacklist refresh token)
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.redisService.blacklistToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    // Check for common passwords
    const commonPasswords = ['password', '123456', 'password123', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      throw new BadRequestException('Password is too common. Please use a stronger password.');
    }

    // Check for complexity (at least one uppercase, one lowercase, one number)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email_verification_token: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Check if token has expired
    if (user.email_verification_expires < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Mark email as verified
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return { message: 'If your email is registered, you will receive a verification email.' };
    }

    if (user.email_verified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const { token: emailVerificationToken, expires: emailVerificationExpires } = generateEmailVerificationToken();

    user.email_verification_token = emailVerificationToken;
    user.email_verification_expires = emailVerificationExpires;
    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(email, user.full_name, emailVerificationToken);

    return { message: 'Verification email sent' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Don't reveal if email exists or not (security)
    if (!user) {
      return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    // Generate password reset token
    const { token: passwordResetToken, expires: passwordResetExpires } = generatePasswordResetToken();

    user.password_reset_token = passwordResetToken;
    user.password_reset_expires = passwordResetExpires;
    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(email, user.full_name, passwordResetToken);

    return { message: 'If your email is registered, you will receive a password reset link.' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user by reset token
    const user = await this.userRepository.findOne({
      where: { password_reset_token: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (user.password_reset_expires < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password and clear reset token
    user.password_hash = password_hash;
    user.password_reset_token = null;
    user.password_reset_expires = null;

    // Reset failed login attempts
    user.failed_login_attempts = 0;
    user.account_locked_until = null;

    await this.userRepository.save(user);

    // Invalidate all existing refresh tokens for security
    // User will need to login again with new password
    await this.redisService.invalidateCache(`refresh_token:${user.id}:*`);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> {
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Find user
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(user.password_hash, currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(user.password_hash, newPassword);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    user.password_hash = password_hash;
    await this.userRepository.save(user);

    // Invalidate all existing refresh tokens for security
    await this.redisService.invalidateCache(`refresh_token:${user.id}:*`);

    return { message: 'Password changed successfully. Please login with your new password.' };
  }

  /**
   * Handle OAuth login/registration
   */
  async oauthLogin(oauthUser: {
    oauthId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    provider: string;
  }): Promise<{ user: Partial<User>; tokens: TokenPair; isNewUser: boolean }> {
    const { oauthId, email, fullName, avatarUrl, provider } = oauthUser;

    // Check if user exists with this OAuth provider
    let user = await this.userRepository.findOne({
      where: { oauth_provider: provider, oauth_id: oauthId },
    });

    let isNewUser = false;

    if (!user) {
      // Check if user exists with this email (account linking)
      user = await this.userRepository.findOne({ where: { email } });

      if (user) {
        // Link OAuth account to existing user
        user.oauth_provider = provider;
        user.oauth_id = oauthId;
        if (avatarUrl) user.avatar_url = avatarUrl;
        await this.userRepository.save(user);
      } else {
        // Create new user
        isNewUser = true;
        user = this.userRepository.create({
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          oauth_provider: provider,
          oauth_id: oauthId,
          email_verified: true, // OAuth emails are pre-verified
          role: 'candidate', // Default role
        });
        await this.userRepository.save(user);
      }
    }

    // Update last login
    user.last_login_at = new Date();
    await this.userRepository.save(user);

    // Generate JWT tokens
    const tokens = this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.tier,
      false
    );

    // Store refresh token in Redis
    await this.redisService.storeRefreshToken(user.id, tokens.refreshToken, 7);

    // Remove sensitive data
    const { password_hash, mfa_secret, email_verification_token, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      tokens,
      isNewUser,
    };
  }

  /**
   * Setup MFA (TOTP) for user
   */
  async setupMfa(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestException('MFA is already enabled for this account');
    }

    // Generate MFA secret
    const secret = generateMfaSecret();

    // Generate QR code
    const qrCode = await generateMfaQrCode(user.email, secret);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Store secret and backup codes (not enabled yet until verified)
    user.mfa_secret = secret;
    user.mfa_backup_codes = hashedBackupCodes;
    await this.userRepository.save(user);

    return {
      secret,
      qrCode,
      backupCodes, // Return unhashed codes for user to save
    };
  }

  /**
   * Verify and enable MFA
   */
  async verifyAndEnableMfa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestException('MFA is already enabled for this account');
    }

    if (!user.mfa_secret) {
      throw new BadRequestException('MFA setup not initiated. Please start MFA setup first.');
    }

    // Verify the TOTP code
    const isValid = verifyMfaCode(user.mfa_secret, code);

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code. Please try again.');
    }

    // Enable MFA
    user.mfa_enabled = true;
    await this.userRepository.save(user);

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, password: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException('MFA is not enabled for this account');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Verify MFA code or backup code
    let isCodeValid = false;

    // Try TOTP code first
    if (user.mfa_secret) {
      isCodeValid = verifyMfaCode(user.mfa_secret, code);
    }

    // If TOTP failed, try backup code
    if (!isCodeValid && user.mfa_backup_codes) {
      const backupResult = await verifyBackupCode(code, user.mfa_backup_codes);
      isCodeValid = backupResult.valid;
    }

    if (!isCodeValid) {
      throw new BadRequestException('Invalid MFA code or backup code');
    }

    // Disable MFA and clear secrets
    user.mfa_enabled = false;
    user.mfa_secret = null;
    user.mfa_backup_codes = null;
    await this.userRepository.save(user);

    return { message: 'MFA disabled successfully' };
  }

  /**
   * Verify MFA code during login (already handled in login method)
   * This is a separate method for clarity
   */
  async verifyMfaLogin(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return false;
    }

    // Try TOTP code first
    let isValid = verifyMfaCode(user.mfa_secret, code);

    // If TOTP failed, try backup code
    if (!isValid && user.mfa_backup_codes) {
      const backupResult = await verifyBackupCode(code, user.mfa_backup_codes);
      isValid = backupResult.valid;

      if (isValid) {
        // Update backup codes (remove used code)
        user.mfa_backup_codes = backupResult.remainingCodes;
        await this.userRepository.save(user);
      }
    }

    return isValid;
  }
}
