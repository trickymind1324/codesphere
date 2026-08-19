import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
