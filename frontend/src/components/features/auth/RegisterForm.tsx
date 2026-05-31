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

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name must not exceed 255 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['candidate', 'recruiter'], {
      required_error: 'Please select a role',
    }),
    accept_terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const register_user = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: 'candidate',
      accept_terms: false,
    },
  });

  const password = watch('password');

  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return '';
    if (password.length < 12) return 'weak';

    let strength = 0;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength < 3) return 'weak';
    if (strength === 3) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);

      await register_user({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
      });

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
        <p className="text-muted-foreground">
          Join CodeSphere and start your coding journey
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('full_name')}
          type="text"
          label="Full Name"
          placeholder="John Doe"
          error={errors.full_name?.message}
          disabled={isLoading}
        />

        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
        />

        <div>
          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            disabled={isLoading}
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                <div
                  className={`h-1 flex-1 rounded ${
                    passwordStrength === 'weak'
                      ? 'bg-red-500'
                      : passwordStrength === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded ${
                    passwordStrength === 'medium' || passwordStrength === 'strong'
                      ? passwordStrength === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded ${
                    passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Password strength:{' '}
                <span
                  className={
                    passwordStrength === 'weak'
                      ? 'text-red-500'
                      : passwordStrength === 'medium'
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }
                >
                  {passwordStrength}
                </span>
              </p>
            </div>
          )}
        </div>

        <Input
          {...register('confirm_password')}
          type="password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          error={errors.confirm_password?.message}
          disabled={isLoading}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            I am a
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                {...register('role')}
                type="radio"
                value="candidate"
                className="h-4 w-4"
                disabled={isLoading}
              />
              <span className="text-sm">Candidate</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                {...register('role')}
                type="radio"
                value="recruiter"
                className="h-4 w-4"
                disabled={isLoading}
              />
              <span className="text-sm">Recruiter</span>
            </label>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2">
            <input
              {...register('accept_terms')}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.accept_terms && (
            <p className="mt-1 text-sm text-red-500">{errors.accept_terms.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
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
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
