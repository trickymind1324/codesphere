import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Root route: never a dead end. Send signed-out visitors to login and
 * signed-in users to their role's home, so nobody lands on a blank page.
 */
export function HomeRedirect() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isAuthenticated) await checkAuth();
      setChecking(false);
    })();
  }, [isAuthenticated, checkAuth]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isRecruiter = ['recruiter', 'company_admin', 'platform_admin'].includes(user.role);
  return <Navigate to={isRecruiter ? '/recruiter/dashboard' : '/problems'} replace />;
}
