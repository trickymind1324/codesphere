import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { hashPassword, verifyPassword, generateEmailVerificationToken, isAccountLocked, calculateLockTime } from '../utils/crypto.util';
import { JwtService, TokenPair } from '../utils/jwt.util';
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
      // TODO: Verify MFA code (will implement in Week 4)
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
}
