import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
