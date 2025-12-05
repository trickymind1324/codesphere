import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

/**
 * Generate MFA secret for TOTP
 */
export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code for MFA setup
 * @param email - User email
 * @param secret - MFA secret
 */
export async function generateMfaQrCode(
  email: string,
  secret: string
): Promise<string> {
  const otpauth = authenticator.keyuri(email, 'CodeSphere', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
  return qrCodeDataUrl;
}

/**
 * Verify TOTP code
 * @param secret - MFA secret
 * @param code - 6-digit TOTP code
 */
export function verifyMfaCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate backup codes for MFA
 * @param count - Number of backup codes to generate (default: 10)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 * Since these are one-time use, we'll hash them
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const crypto = await import('crypto');
  return codes.map(code =>
    crypto.createHash('sha256').update(code).digest('hex')
  );
}

/**
 * Verify backup code against hashed codes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; remainingCodes: string[] }> {
  const crypto = await import('crypto');
  const hashedInput = crypto.createHash('sha256').update(code).digest('hex');

  const index = hashedCodes.indexOf(hashedInput);

  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes };
  }

  // Remove used backup code
  const remainingCodes = [...hashedCodes];
  remainingCodes.splice(index, 1);

  return { valid: true, remainingCodes };
}
