'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, Lock } from 'lucide-react';
import { LoginForm, RegisterForm } from '@/features/auth';
import useAuthStore from '@/store/auth';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900 relative">
      {/* Subtle decorative background blur accents */}
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Enterprise Learning & Capacity Portal</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Capacity Connect
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Continuous skill development, competency mapping, assessments, and trainer matching.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <div className="pt-1">
          {activeTab === 'signin' ? (
            <LoginForm onSuccess={() => router.push('/')} />
          ) : (
            <RegisterForm onSuccess={() => router.push('/')} />
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Session</span>
          </span>
          <span className="font-semibold text-slate-600">Phase 1 • v0.1.0-auth</span>
        </div>
      </div>
    </div>
  );
}
