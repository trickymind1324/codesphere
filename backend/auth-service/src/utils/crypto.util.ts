import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

/**
 * Hash password using Argon2id
 * As per security requirements in FRD-05-Security-Compliance.md
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 threads
  });
}

/**
 * Verify password against hash using Argon2
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): {
  token: string;
  expires: Date;
} {
  const token = generateSecureToken(32);
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours validity

  return { token, expires };
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): {
  token: string;
  expires: Date;
} {
  const token = generateSecureToken(32);
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour validity

  return { token, expires };
}

/**
 * Check if account is locked
 */
export function isAccountLocked(
  failedAttempts: number,
  lockedUntil: Date | null
): boolean {
  // Lock after 5 failed attempts
  if (failedAttempts >= 5) {
    if (lockedUntil && lockedUntil > new Date()) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate account lock time (15 minutes)
 */
export function calculateLockTime(): Date {
  const lockTime = new Date();
  lockTime.setMinutes(lockTime.getMinutes() + 15);
  return lockTime;
}
