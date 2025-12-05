import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get provider from path (e.g., /auth/google/callback or /auth/github/callback)
        const pathParts = location.pathname.split('/');
        const provider = pathParts[2]; // 'google' or 'github'

        // Get authorization code or error from URL params
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from OAuth provider');
        }

        // Exchange code for tokens by calling backend
        const response = await api.get(`/api/v1/auth/${provider}/callback`, {
          params: { code },
        });

        const { accessToken, user } = response.data;

        // Store access token in localStorage
        localStorage.setItem('accessToken', accessToken);

        // Update auth store (setUser will also set isAuthenticated)
        setUser(user);

        setStatus('success');
        toast.success(`Successfully signed in with ${provider}!`);

        // Redirect to dashboard or return URL
        const returnUrl = searchParams.get('state') || '/dashboard';
        setTimeout(() => {
          navigate(returnUrl, { replace: true });
        }, 1000);
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        const message = error.response?.data?.message || error.message || 'OAuth authentication failed';
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    };

    handleOAuthCallback();
  }, [location.pathname, searchParams, navigate, setUser]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <h1 className="text-2xl font-bold tracking-tight">Signing you in...</h1>
            <p className="text-muted-foreground">
              Please wait while we complete the authentication process
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Authentication Successful!</h1>
            <p className="text-muted-foreground">
              Redirecting you to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Authentication Failed</h1>
          <p className="text-muted-foreground">
            {errorMessage || 'Something went wrong during the authentication process'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              This could happen if you denied access, the authentication timed out, or there was a
              server error.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
