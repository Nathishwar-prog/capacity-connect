'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminAiInsightsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/analytics?askAi=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      <h2 className="text-lg font-bold text-slate-800">Redirecting to Analytics & AI Command Center...</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        AI Insights has been unified into the central Executive Analytics dashboard with our interactive AI Assistant.
      </p>
      <a
        href="/admin/analytics?askAi=true"
        className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-indigo-700 transition-colors"
      >
        Go to Analytics Command Center
      </a>
    </div>
  );
}
