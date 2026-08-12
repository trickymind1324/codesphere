import type { User } from '@/types';

/**
 * Auth mode switch. 'legacy' keeps the email/password flow against auth-service;
 * 'oidc' authenticates against Keycloak using the Resource Owner Password grant
 * — the app keeps its own login form and calls Keycloak's token endpoint
 * directly, so the Keycloak-hosted login page never appears.
 *
 * Trade-off: this flow does not support MFA or social/identity brokering
 * (those need the browser redirect flow). It is a deliberate choice for a
 * first-party email/password login.
 */
export const AUTH_MODE: 'legacy' | 'oidc' =
  import.meta.env.VITE_AUTH_MODE === 'oidc' ? 'oidc' : 'legacy';

const AUTHORITY = import.meta.env.VITE_OIDC_AUTHORITY || '/realms/codesphere';
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || 'codesphere-frontend';
const TOKEN_ENDPOINT = `${AUTHORITY}/protocol/openid-connect/token`;
const LOGOUT_ENDPOINT = `${AUTHORITY}/protocol/openid-connect/logout`;

const REFRESH_KEY = 'kc_refresh_token';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** Map Keycloak access-token claims to the app's User shape. */
export function mapUserFromToken(accessToken: string): User {
  const c = decodeJwt(accessToken);
  const realmRoles = ((c.realm_access as { roles?: string[] } | undefined)?.roles) ?? [];
  const role: User['role'] = realmRoles.includes('recruiter') ? 'recruiter' : 'candidate';
  return {
    id: String(c.sub ?? ''),
    email: String(c.email ?? c.preferred_username ?? ''),
    name: String(c.name ?? c.preferred_username ?? c.email ?? ''),
    role,
    tier: 'free',
    emailVerified: Boolean(c.email_verified ?? false),
    createdAt: '',
  };
}

function storeTokens(t: TokenResponse): void {
  localStorage.setItem('accessToken', t.access_token);
  localStorage.setItem(REFRESH_KEY, t.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem(REFRESH_KEY);
}

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }).toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || 'Authentication failed');
  }
  return res.json();
}

/** Exchange email + password for tokens via Keycloak; returns the mapped user. */
export async function passwordLogin(email: string, password: string): Promise<User> {
  const tokens = await postToken({
    grant_type: 'password',
    username: email,
    password,
    scope: 'openid',
  });
  storeTokens(tokens);
  return mapUserFromToken(tokens.access_token);
}

/** Refresh the access token; returns the new access token or throws. */
export async function refreshTokens(): Promise<string> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error('No refresh token');
  const tokens = await postToken({ grant_type: 'refresh_token', refresh_token: refresh });
  storeTokens(tokens);
  return tokens.access_token;
}

/** Best-effort Keycloak logout, then clear local tokens. */
export async function kcLogout(): Promise<void> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (refresh) {
    try {
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, refresh_token: refresh }).toString(),
      });
    } catch {
      // ignore — we clear local state regardless
    }
  }
  clearTokens();
}

/** Restore a session from the stored access token (refreshing if expired). */
export async function restoreSession(): Promise<User | null> {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  const claims = decodeJwt(token);
  const exp = typeof claims.exp === 'number' ? claims.exp * 1000 : 0;
  if (exp > Date.now() + 5000) {
    return mapUserFromToken(token);
  }
  // expired or near-expiry — try a refresh
  try {
    const fresh = await refreshTokens();
    return mapUserFromToken(fresh);
  } catch {
    clearTokens();
    return null;
  }
}
