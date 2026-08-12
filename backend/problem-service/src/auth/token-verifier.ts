import * as jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwksClient } from 'jwks-rsa';

/**
 * Normalised principal every guard attaches to `request.user`, regardless of
 * whether the token came from Keycloak or the legacy auth-service.
 */
export interface VerifiedUser {
  sub: string;
  email?: string;
  role?: string; // single app role for RolesGuard: 'recruiter' | 'candidate'
  roles: string[]; // all roles carried by the token
  [key: string]: unknown;
}

interface VerifierConfig {
  get<T = string>(key: string): T | undefined;
  get<T = string>(key: string, def: T): T;
}

/**
 * Verifies bearer tokens from two issuers during the Keycloak migration:
 *   1. Keycloak — RS256 validated against the realm JWKS (issuer + audience).
 *   2. Legacy auth-service — RS256 validated against the mounted public key.
 *
 * The legacy path is kept until the frontend fully moves to OIDC (tracked as
 * the auth-service decommission), then LEGACY_AUTH_ENABLED is turned off.
 */
export class TokenVerifier {
  private readonly keycloakIssuer?: string;
  private readonly keycloakAudience: string;
  private readonly jwks?: JwksClient;

  private readonly legacyEnabled: boolean;
  private readonly legacyPublicKey?: string;
  private readonly legacyIssuer: string;
  private readonly legacyAudience: string;

  constructor(config: VerifierConfig) {
    this.keycloakIssuer = config.get<string>('KEYCLOAK_ISSUER');
    this.keycloakAudience = config.get<string>('KEYCLOAK_AUDIENCE', 'codesphere-api');
    const jwksUri = config.get<string>('KEYCLOAK_JWKS_URI');
    if (this.keycloakIssuer && jwksUri) {
      this.jwks = new JwksClient({
        jwksUri,
        cache: true,
        cacheMaxAge: 10 * 60 * 1000, // 10 min — survives key rotation lookups
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      });
    }

    // Legacy auth-service tokens (default on until decommission).
    this.legacyEnabled = config.get<string>('LEGACY_AUTH_ENABLED', 'true') !== 'false';
    this.legacyIssuer = config.get<string>('LEGACY_JWT_ISSUER', 'codesphere.com');
    this.legacyAudience = config.get<string>('LEGACY_JWT_AUDIENCE', 'codesphere-api');
    if (this.legacyEnabled) {
      const inline = config.get<string>('JWT_PUBLIC_KEY');
      if (inline) {
        this.legacyPublicKey = inline;
      } else {
        const keyPath =
          config.get<string>('JWT_PUBLIC_KEY_FILE') ||
          join(__dirname, '../../keys/public.pem');
        try {
          this.legacyPublicKey = readFileSync(keyPath, 'utf8');
        } catch {
          // No legacy key present — fine once fully on Keycloak.
          this.legacyPublicKey = undefined;
        }
      }
    }
  }

  /** Verify a raw bearer token; throws if it is invalid under both issuers. */
  async verify(token: string): Promise<VerifiedUser> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Malformed token');
    }
    const issuer = (decoded.payload as jwt.JwtPayload).iss;

    if (this.jwks && this.keycloakIssuer && issuer === this.keycloakIssuer) {
      return this.verifyKeycloak(token, decoded.header.kid);
    }
    if (this.legacyEnabled && this.legacyPublicKey) {
      return this.verifyLegacy(token);
    }
    throw new Error('Untrusted token issuer');
  }

  private async verifyKeycloak(token: string, kid?: string): Promise<VerifiedUser> {
    if (!kid) throw new Error('Token missing key id');
    const key = await this.jwks!.getSigningKey(kid);
    const payload = jwt.verify(token, key.getPublicKey(), {
      algorithms: ['RS256'],
      issuer: this.keycloakIssuer,
      audience: this.keycloakAudience,
    }) as jwt.JwtPayload;
    return this.normalizeKeycloak(payload);
  }

  private verifyLegacy(token: string): VerifiedUser {
    const payload = jwt.verify(token, this.legacyPublicKey!, {
      algorithms: ['RS256'],
      issuer: this.legacyIssuer,
      audience: this.legacyAudience,
    }) as jwt.JwtPayload;
    const roles = payload.role ? [String(payload.role)] : [];
    return { ...payload, sub: String(payload.sub), roles, role: payload.role as string };
  }

  /** Map a Keycloak token to the shared principal shape. */
  normalizeKeycloak(payload: jwt.JwtPayload): VerifiedUser {
    const realmRoles: string[] =
      (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    // recruiter outranks candidate when both are present.
    const role = realmRoles.includes('recruiter')
      ? 'recruiter'
      : realmRoles.includes('candidate')
        ? 'candidate'
        : undefined;
    return {
      ...payload,
      sub: String(payload.sub),
      email: payload.email as string | undefined,
      roles: realmRoles,
      role,
    };
  }
}

/** Process-wide singleton so the JWKS cache is shared across guards. */
let singleton: TokenVerifier | undefined;
export function getTokenVerifier(config: VerifierConfig): TokenVerifier {
  if (!singleton) singleton = new TokenVerifier(config);
  return singleton;
}
