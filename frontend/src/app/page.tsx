'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import useAuthStore from '@/store/auth';
import { getRoleDashboardRoute } from '@/constants/roles';

export default function RootPage() {
  const { user, isAuthenticated, isInitializing } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing) {
      if (isAuthenticated && user) {
        router.replace(getRoleDashboardRoute(user.role));
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isInitializing, user, router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border border-slate-200 shadow-sm">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">Capacity Connect</h3>
          <p className="text-xs font-medium text-slate-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    </div>
  );
}
