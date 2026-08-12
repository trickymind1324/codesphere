import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserManager, mapOidcUser, syncAccessToken } from '@/lib/oidc';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

/**
 * Handles the OIDC redirect back from Keycloak: completes the PKCE code
 * exchange, populates the auth store, and forwards the user on.
 */
export function OidcCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const oidcUser = await getUserManager().signinRedirectCallback();
        syncAccessToken(oidcUser);
        setUser(mapOidcUser(oidcUser));
        toast.success('Signed in');
        const target = (oidcUser.state as string) || '/dashboard';
        navigate(target, { replace: true });
      } catch (err: any) {
        console.error('OIDC callback error:', err);
        setError(err?.message || 'Sign-in failed');
        toast.error('Sign-in failed');
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        {!error ? (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h1 className="text-xl font-semibold tracking-tight">Signing you in…</h1>
            <p className="text-sm text-muted-foreground">Completing authentication.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
