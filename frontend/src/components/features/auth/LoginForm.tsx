import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
  mfa_code: z.string().length(6, 'MFA code must be 6 digits').optional().or(z.literal('')),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: false,
      mfa_code: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      await login({
        email: data.email,
        password: data.password,
        remember_me: data.remember_me,
        mfa_code: data.mfa_code || undefined,
      });

      toast.success('Login successful!');

      // Redirect based on user role
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      const errorMessage = error.response?.data?.message || 'Login failed';

      // Check if MFA is required
      if (errorMessage.includes('MFA code required')) {
        setShowMfaInput(true);
        toast.error('Please enter your MFA code');
      } else if (errorMessage.includes('Invalid MFA code')) {
        setError('mfa_code', {
          message: 'Invalid MFA code. Please try again.',
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to your CodeSphere account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Input
          {...register('password')}
          type="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          disabled={isLoading}
        />

        {showMfaInput && (
          <Input
            {...register('mfa_code')}
            type="text"
            label="MFA Code"
            placeholder="Enter 6-digit code"
            maxLength={6}
            error={errors.mfa_code?.message}
            disabled={isLoading}
          />
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              {...register('remember_me')}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = authApi.getGoogleOAuthUrl();
          }}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = authApi.getGithubOAuthUrl();
          }}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
