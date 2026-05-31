import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('candidate' | 'recruiter' | 'company_admin' | 'platform_admin')[];
  requireEmailVerified?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireEmailVerified = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        await checkAuth();
      }
      setIsChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, checkAuth]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireEmailVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard instead of showing error
    const isRecruiterRoute = allowedRoles.some(role =>
      ['recruiter', 'company_admin', 'platform_admin'].includes(role)
    );
    const isRecruiter = ['recruiter', 'company_admin', 'platform_admin'].includes(user.role);

    // If candidate tries to access recruiter route, redirect to candidate dashboard
    if (isRecruiterRoute && !isRecruiter) {
      return <Navigate to="/problems" replace />;
    }

    // If recruiter tries to access candidate route, redirect to recruiter dashboard
    if (!isRecruiterRoute && isRecruiter) {
      return <Navigate to="/recruiter/dashboard" replace />;
    }

    // Fallback error page for other cases
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md space-y-4 text-center p-6">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page. This page is restricted to{' '}
            {allowedRoles.join(', ')} accounts.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
