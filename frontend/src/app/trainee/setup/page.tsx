'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function TraineeSetupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trainee/onboarding');
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-5 rounded-3xl border-slate-200 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Redirecting to Trainee Onboarding</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Loading your role competency onboarding wizard and diagnostic pathway...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Launching wizard...</span>
            </div>
            <Button
              onClick={() => router.push('/trainee/onboarding')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <span>Go to Onboarding</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
