'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2 } from 'lucide-react';

export default function TrainerAssessmentRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;

  useEffect(() => {
    if (assessmentId) {
      router.replace(`/trainer/assessments/${assessmentId}/builder`);
    }
  }, [assessmentId, router]);

  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Opening Assessment Builder...</p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
