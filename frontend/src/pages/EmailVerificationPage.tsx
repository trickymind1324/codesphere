import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('no-token');
        return;
      }

      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } catch (error: any) {
        console.error('Email verification error:', error);
        const message = error.response?.data?.message || 'Failed to verify email';
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <h1 className="text-2xl font-bold tracking-tight">Verifying Your Email...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your email address
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
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
            <h1 className="text-3xl font-bold tracking-tight">Email Verified!</h1>
            <p className="text-muted-foreground">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>You will be redirected to the sign in page in a few seconds...</p>
            </div>

            <Link to="/login">
              <Button className="w-full">
                Continue to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'no-token') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg
                className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Missing Verification Token</h1>
            <p className="text-muted-foreground">
              No verification token was provided in the URL.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>
                Please check your email for the verification link and click on it to verify your
                account.
              </p>
            </div>

            <Link to="/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Verification Failed</h1>
          <p className="text-muted-foreground">
            {errorMessage || 'Unable to verify your email address'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              This could happen if the verification link has expired or has already been used. You
              may need to request a new verification email.
            </p>
          </div>

          <Link to="/login">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
