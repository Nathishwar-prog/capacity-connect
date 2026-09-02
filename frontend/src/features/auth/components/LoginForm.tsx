'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
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
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Work Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="name@organization.com"
              disabled={isPending}
              className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-indigo-600'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••••••"
              disabled={isPending}
              className={`w-full pl-9 pr-10 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-indigo-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Capacity Connect</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Fill Demo Section */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Quick Demo Access (Password: Password123!)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('user@enterprise.com', 'Password123!')}
            className="py-2 px-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-slate-700 font-semibold transition-all text-center"
          >
            Trainee
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('alex.trainer@enterprise.com', 'Password123!')}
            className="py-2 px-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-slate-700 font-semibold transition-all text-center"
          >
            Trainer
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('superadmin@capacityconnect.io', 'Password123!')}
            className="py-2 px-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-slate-700 font-semibold transition-all text-center"
          >
            Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
