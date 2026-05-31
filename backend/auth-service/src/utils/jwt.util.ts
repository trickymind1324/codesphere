import * as jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  tier: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate RSA key pair for JWT signing
 * This will be used for RS256 asymmetric signing
 * Private key signs, public key verifies
 */
export class JwtService {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    // In production, these should be loaded from environment variables or secure vault
    // For development, we'll generate/load them from files
    try {
      this.privateKey = readFileSync(
        join(__dirname, '../../keys/private.pem'),
        'utf8'
      );
      this.publicKey = readFileSync(
        join(__dirname, '../../keys/public.pem'),
        'utf8'
      );
    } catch (error) {
      // If keys don't exist, we'll use a fallback (development only)
      console.warn('JWT keys not found, using development fallback');
      this.privateKey = process.env.JWT_PRIVATE_KEY || '';
      this.publicKey = process.env.JWT_PUBLIC_KEY || '';
    }
  }

  /**
   * Generate access token (15 minutes)
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m',
      issuer: 'codesphere.com',
      audience: 'codesphere-api',
    });
  }

  /**
   * Generate refresh token (7 days or 30 days with remember_me)
   */
  generateRefreshToken(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    rememberMe: boolean = false
  ): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: rememberMe ? '30d' : '7d',
      issuer: 'codesphere.com',
      audience: 'codesphere-api',
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(
    userId: string,
    email: string,
    role: string,
    tier: string,
    rememberMe: boolean = false
  ): TokenPair {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      tier,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload, rememberMe),
    };
  }

  /**
   * Verify and decode token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'codesphere.com',
        audience: 'codesphere-api',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  }
}
