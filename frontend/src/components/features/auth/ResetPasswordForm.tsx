import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
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

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setTokenError(true);
      toast.error('Invalid or missing reset token');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword({
        token,
        new_password: data.password,
      });

      toast.success('Password reset successfully! You can now sign in with your new password.');
      navigate('/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password';

      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setTokenError(true);
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || tokenError) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
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
          <h1 className="text-3xl font-bold tracking-tight">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              Password reset links expire after 1 hour for security reasons. Please request a new
              one.
            </p>
          </div>

          <Link to="/forgot-password">
            <Button type="button" className="w-full">
              Request New Reset Link
            </Button>
          </Link>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            {...register('password')}
            type="password"
            label="New Password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            disabled={isLoading}
            autoFocus
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
          label="Confirm New Password"
          placeholder="Re-enter your password"
          error={errors.confirm_password?.message}
          disabled={isLoading}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>

      <div className="text-center">
        <Link to="/login" className="text-sm text-primary hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
