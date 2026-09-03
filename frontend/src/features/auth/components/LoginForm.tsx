'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { loginValidationSchema, LoginFormData } from '../validation/auth.validation';
import { useLogin } from '../hooks/useLogin';
import { ApiErrorResponse } from '../types/auth.types';
import { getRoleDashboardRoute } from '@/constants/roles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  onSuccess?: (role: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: login, isPending } = useLogin({
    onSuccess: (data) => {
      setErrorMessage(null);
      const targetRoute = getRoleDashboardRoute(data.user.role);
      if (onSuccess) {
        onSuccess(data.user.role);
      } else {
        router.push(targetRoute);
      }
    },
    onError: (error: AxiosError<ApiErrorResponse> | Error) => {
      let message = 'Invalid email or password. Please verify your credentials.';
      if ('response' in error && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      setErrorMessage(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setErrorMessage(null);
    login(data);
  };

  return (
    <div className="space-y-5">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Official Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold text-slate-700">
            Official Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              placeholder="official@moes.gov.in / imd.gov.in"
              disabled={isPending}
              error={!!errors.email}
              className="pl-10"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold text-slate-700">
              Password
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              placeholder="••••••••••••"
              disabled={isPending}
              error={!!errors.password}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
          className="w-full h-11 text-xs font-extrabold tracking-wide"
        >
          {!isPending && <LogIn className="w-4 h-4 mr-2" />}
          <span>Sign In to Capacity Connect</span>
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
