'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, CloudSun, Lock } from 'lucide-react';
import { LoginForm, RegisterForm } from '@/features/auth';
import useAuthStore from '@/store/auth';
import { getRoleDashboardRoute } from '@/constants/roles';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const { isAuthenticated, user, isInitializing } = useAuthStore();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      router.push(getRoleDashboardRoute(user.role));
    }
  }, [isAuthenticated, user, isInitializing, router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-900 text-slate-900 relative selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Institutional Container */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/20 p-7 sm:p-9 relative z-10 space-y-6">
        {/* Government / Institutional Header */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-bold tracking-wide">
            <CloudSun className="w-3.5 h-3.5 text-indigo-600" />
            <span>MoES / IMD Capacity Building Portal</span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Capacity Connect
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">
                Atmospheric & Climate Sciences LMS
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-sm leading-relaxed pt-1">
            Official learning management, competency certification, and operational meteorological
            training.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Official Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Trainee Registration
          </button>
        </div>

        {/* Form Switcher */}
        <div className="pt-0.5">
          {activeTab === 'signin' ? (
            <LoginForm
              onSuccess={(role) => {
                router.push(getRoleDashboardRoute(role));
              }}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {
                router.push('/dashboard/trainee');
              }}
            />
          )}
        </div>

        {/* Institutional Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Govt. Enterprise RBAC</span>
          </span>
          <span className="text-slate-400">MoES • IMD Digital Portal</span>
        </div>
      </div>
    </div>
  );
}
