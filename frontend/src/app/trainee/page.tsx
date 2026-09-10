'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function TraineeRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/trainee');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold">Navigating to Trainee Cockpit...</span>
      </div>
    </div>
  );
}
