'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { loginValidationSchema, LoginFormData } from '../validation/auth.validation';
import { useLogin } from '../hooks/useLogin';
import { ApiErrorResponse } from '../types/auth.types';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: login, isPending } = useLogin({
    onSuccess: () => {
      setErrorMessage(null);
      if (onSuccess) onSuccess();
    },
    onError: (error: AxiosError<ApiErrorResponse> | Error) => {
      let message = 'Authentication failed. Please check your credentials.';
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

  const handleQuickFill = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="user@enterprise.com"
              disabled={isPending}
              className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-900/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                errors.email
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-slate-800 focus:border-indigo-500/50'
              }`}
            />
          </div>
          {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••••••"
              disabled={isPending}
              className={`w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                errors.password
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-slate-800 focus:border-indigo-500/50'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Capacity Connect</span>
          )}
        </button>
      </form>

      {/* Quick Fill Demo Section */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Demo Accounts</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('superadmin@capacityconnect.io', 'Password123!')}
            className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/30 text-[11px] text-slate-300 font-medium transition-all text-center truncate"
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('alex.trainer@enterprise.com', 'Password123!')}
            className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/30 text-[11px] text-slate-300 font-medium transition-all text-center truncate"
          >
            Trainer
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('user@enterprise.com', 'Password123!')}
            className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/30 text-[11px] text-slate-300 font-medium transition-all text-center truncate"
          >
            Trainee
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
