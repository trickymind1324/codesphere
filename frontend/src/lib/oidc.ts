import { UserManager, WebStorageStateStore, type User as OidcUser } from 'oidc-client-ts';
import type { User } from '@/types';

/**
 * Auth mode switch. 'legacy' keeps the email/password flow against auth-service;
 * 'oidc' uses Keycloak. Build-time flag so the default stays legacy until the
 * Keycloak rollout is verified end-to-end.
 */
export const AUTH_MODE: 'legacy' | 'oidc' =
  import.meta.env.VITE_AUTH_MODE === 'oidc' ? 'oidc' : 'legacy';

let manager: UserManager | null = null;

/** Lazily build the OIDC UserManager from build-time env. */
export function getUserManager(): UserManager {
  if (manager) return manager;
  const authority = import.meta.env.VITE_OIDC_AUTHORITY || '/realms/codesphere';
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'codesphere-frontend';
  manager = new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'openid profile email',
    // Tokens live in localStorage so a reload restores the session.
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    automaticSilentRenew: true,
    monitorSession: false,
  });
  return manager;
}

/** Decode a JWT payload without verifying (verification happens server-side). */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** Map a Keycloak session to the app's User shape (roles come from the token). */
export function mapOidcUser(oidc: OidcUser): User {
  const profile = oidc.profile as Record<string, unknown>;
  const claims = oidc.access_token ? decodeJwt(oidc.access_token) : {};
  const realmRoles =
    ((claims.realm_access as { roles?: string[] } | undefined)?.roles) ?? [];
  const role: User['role'] = realmRoles.includes('recruiter')
    ? 'recruiter'
    : 'candidate';
  return {
    id: String(profile.sub ?? ''),
    email: String(profile.email ?? ''),
    name: String(profile.name ?? profile.preferred_username ?? profile.email ?? ''),
    role,
    tier: 'free',
    emailVerified: Boolean(profile.email_verified ?? false),
    createdAt: '',
  };
}

/**
 * Persist the OIDC access token where the axios interceptor already looks
 * (`localStorage.accessToken`), so the existing request wiring is unchanged.
 */
export function syncAccessToken(oidc: OidcUser | null): void {
  if (oidc?.access_token) {
    localStorage.setItem('accessToken', oidc.access_token);
  } else {
    localStorage.removeItem('accessToken');
  }
}
