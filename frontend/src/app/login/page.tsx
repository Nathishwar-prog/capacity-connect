'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import useAuthStore from '@/store/auth';

export default function LoginPage() {
  const { setCredentials } = useAuthStore();
  const router = useRouter();

  const handleDemoLogin = (role: 'SUPER_ADMIN' | 'USER') => {
    setCredentials(
      {
        id: role === 'SUPER_ADMIN' ? 'admin-uuid' : 'user-uuid',
        email: role === 'SUPER_ADMIN' ? 'admin@enterprise.com' : 'user@enterprise.com',
        firstName: role === 'SUPER_ADMIN' ? 'System' : 'Jane',
        lastName: role === 'SUPER_ADMIN' ? 'Administrator' : 'Doe',
        role,
        permissions: role === 'SUPER_ADMIN' ? ['*'] : ['users:read'],
      },
      'simulated-access-token',
    );
    router.push('/');
  };

  return (
    <div className="h-full min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-2xl backdrop-blur-xl w-full max-w-md p-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-slate-100">Capacity Connect</h2>
          <p className="text-xs text-slate-400">Authentication Portal</p>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => handleDemoLogin('SUPER_ADMIN')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            Authenticate as Super Admin
          </button>
          <button
            onClick={() => handleDemoLogin('USER')}
            className="w-full py-2.5 border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white font-medium text-sm rounded-lg transition-colors"
          >
            Authenticate as Standard User
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          This is a template sign-in console. Connect real backend auth at{' '}
          <code className="text-indigo-400 font-mono">userApi.login()</code>.
        </p>
      </div>
    </div>
  );
}
