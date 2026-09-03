import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        The requested resource or meteorological portal page does not exist or has been relocated.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Portal</span>
      </Link>
    </div>
  );
}
