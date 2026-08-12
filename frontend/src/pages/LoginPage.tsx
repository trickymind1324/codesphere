import { LoginForm } from '@/components/features/auth/LoginForm';
import { AUTH_MODE } from '@/lib/oidc';
import { useAuthStore } from '@/stores/auth.store';

export function LoginPage() {
  const loginWithSSO = useAuthStore((s) => s.loginWithSSO);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      {AUTH_MODE === 'oidc' ? (
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to CodeSphere</h1>
            <p className="text-muted-foreground">Sign in to continue</p>
          </div>
          <button
            onClick={() => loginWithSSO()}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </button>
          <p className="text-xs text-muted-foreground">
            You'll be redirected to the CodeSphere sign-in page.
          </p>
        </div>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
