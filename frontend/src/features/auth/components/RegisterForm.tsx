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
  GraduationCap,
  Award,
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
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Role Selector: Trainee & Trainer Only */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: 'TRAINEE',
                label: 'Trainee',
                desc: 'Access courses, map skills & take assessments',
                icon: GraduationCap,
              },
              {
                value: 'TRAINER',
                label: 'Trainer',
                desc: 'Build courses, deliver training & evaluate trainees',
                icon: Award,
              },
            ].map((roleOption) => {
              const Icon = roleOption.icon;
              const isSelected = selectedRole === roleOption.value;
              return (
                <label
                  key={roleOption.value}
                  className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    value={roleOption.value}
                    {...register('role')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`p-1 rounded-lg ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}
                      >
                        {roleOption.label}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-slate-500 leading-snug">{roleOption.desc}</span>
                </label>
              );
            })}
          </div>
          {errors.role && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.role.message}</p>
          )}
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span className="text-indigo-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                {...register('firstName')}
                placeholder="Jane"
                disabled={isPending}
                className={`w-full pl-8 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.firstName
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
            </div>
            {errors.firstName && (
              <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
            <input
              type="text"
              {...register('lastName')}
              placeholder="Doe"
              disabled={isPending}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Work Email Address <span className="text-indigo-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="jane.doe@enterprise.com"
              disabled={isPending}
              className={`w-full pl-8 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-indigo-600'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 019-2834"
              disabled={isPending}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-indigo-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••••••"
                disabled={isPending}
                className={`w-full pl-8 pr-8 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.password
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password <span className="text-indigo-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••••••"
                disabled={isPending}
                className={`w-full pl-8 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.confirmPassword
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
