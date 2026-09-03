'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { registerValidationSchema, RegisterFormData } from '../validation/auth.validation';
import { useRegister } from '../hooks/useRegister';
import { ApiErrorResponse } from '../types/auth.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerValidationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { mutate: registerUser, isPending } = useRegister({
    onSuccess: () => {
      setErrorMessage(null);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/trainee');
      }
    },
    onError: (error: AxiosError<ApiErrorResponse> | Error) => {
      let message = 'Registration failed. Please check your inputs.';
      if ('response' in error && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      setErrorMessage(message);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setErrorMessage(null);
    registerUser({
      ...data,
      role: 'TRAINEE',
    });
  };

  return (
    <div className="space-y-4">
      {/* Informative institutional role notice */}
      <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
        <p className="leading-relaxed">
          Public registration provisions a <strong>Capacity Building Trainee</strong> account.
          Trainer and Administrative credentials are provisioned by MoES / IMD departmental
          administrators.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="firstName" className="block text-xs font-bold text-slate-700">
              First Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <Input
                id="firstName"
                type="text"
                {...register('firstName')}
                placeholder="First name"
                disabled={isPending}
                error={!!errors.firstName}
                className="pl-9 h-9 text-xs"
              />
            </div>
            {errors.firstName && (
              <p className="text-[10px] text-rose-600 font-medium">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="lastName" className="block text-xs font-bold text-slate-700">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              {...register('lastName')}
              placeholder="Last name"
              disabled={isPending}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700">
            Official Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <Input
              id="reg-email"
              type="email"
              {...register('email')}
              placeholder="official@moes.gov.in / imd.gov.in"
              disabled={isPending}
              error={!!errors.email}
              className="pl-9 h-9 text-xs"
            />
          </div>
          {errors.email && (
            <p className="text-[10px] text-rose-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label htmlFor="phone" className="block text-xs font-bold text-slate-700">
            Phone / Contact Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+91-XXXXXXXXXX"
              disabled={isPending}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••••••"
                disabled={isPending}
                error={!!errors.password}
                className="pl-9 pr-8 h-9 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-rose-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700">
              Confirm <span className="text-rose-500">*</span>
            </label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              placeholder="••••••••••••"
              disabled={isPending}
              error={!!errors.confirmPassword}
              className="h-9 text-xs"
            />
            {errors.confirmPassword && (
              <p className="text-[10px] text-rose-600 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
          className="w-full h-10 mt-2 text-xs font-extrabold"
        >
          {!isPending && <UserPlus className="w-4 h-4 mr-2" />}
          <span>Create Trainee Account</span>
        </Button>
      </form>
    </div>
  );
};

export default RegisterForm;
