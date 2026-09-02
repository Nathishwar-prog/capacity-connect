'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { registerValidationSchema, RegisterFormData } from '../validation/auth.validation';
import { useRegister } from '../hooks/useRegister';
import { ApiErrorResponse } from '../types/auth.types';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerValidationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'TRAINEE',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = watch('role');

  const { mutate: registerUser, isPending } = useRegister({
    onSuccess: () => {
      setErrorMessage(null);
      if (onSuccess) onSuccess();
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
    registerUser(data);
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Role Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            I am joining Capacity Connect as:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'TRAINEE', label: 'Trainee', desc: 'Learn & Upskill' },
              { value: 'TRAINER', label: 'Trainer', desc: 'Teach & Assess' },
              { value: 'ADMIN', label: 'Admin', desc: 'Manage Org' },
            ].map((roleOption) => (
              <label
                key={roleOption.value}
                className={`relative flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedRole === roleOption.value
                    ? 'bg-indigo-600/15 border-indigo-500/80 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  value={roleOption.value}
                  {...register('role')}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-slate-200">{roleOption.label}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{roleOption.desc}</span>
              </label>
            ))}
          </div>
          {errors.role && <p className="text-[11px] text-rose-400 mt-1">{errors.role.message}</p>}
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              First Name <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                {...register('firstName')}
                placeholder="Jane"
                disabled={isPending}
                className={`w-full pl-8 pr-3 py-2 bg-slate-900/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                  errors.firstName
                    ? 'border-rose-500/60'
                    : 'border-slate-800 focus:border-indigo-500/50'
                }`}
              />
            </div>
            {errors.firstName && (
              <p className="text-[10px] text-rose-400 mt-0.5">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
            <input
              type="text"
              {...register('lastName')}
              placeholder="Doe"
              disabled={isPending}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Work Email Address <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="jane.doe@enterprise.com"
              disabled={isPending}
              className={`w-full pl-8 pr-3 py-2 bg-slate-900/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                errors.email ? 'border-rose-500/60' : 'border-slate-800 focus:border-indigo-500/50'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[10px] text-rose-400 mt-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 019-2834"
              disabled={isPending}
              className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••••••"
                disabled={isPending}
                className={`w-full pl-8 pr-8 py-2 bg-slate-900/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                  errors.password
                    ? 'border-rose-500/60'
                    : 'border-slate-800 focus:border-indigo-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-rose-400 mt-0.5">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm Password <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••••••"
                disabled={isPending}
                className={`w-full pl-8 pr-3 py-2 bg-slate-900/80 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                  errors.confirmPassword
                    ? 'border-rose-500/60'
                    : 'border-slate-800 focus:border-indigo-500/50'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-rose-400 mt-0.5">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account & Join</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
