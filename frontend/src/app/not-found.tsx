'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Library,
  RotateCcw,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { getRoleDashboardRoute } from '@/constants/roles';

export default function NotFound() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const dashboardHref = isAuthenticated && user ? getRoleDashboardRoute(user.role) : '/';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-100 text-center relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Atmospheric ambient backdrop lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-950/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        {/* Icon & Badge */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300">
            Navigation Disruption • 404
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            The requested meteorological module or portal endpoint does not exist or has been relocated. Your authenticated session remains fully active.
          </p>
        </div>

        {/* Primary Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <Link
            href={dashboardHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* Quick Trainee Links */}
        <div className="pt-4 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <Link
              href="/trainee/courses"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300 transition-colors group"
            >
              <BookOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <p className="font-bold text-slate-200 truncate">Course Catalog</p>
                <p className="text-[10px] text-slate-500">Explore modules</p>
              </div>
            </Link>

            <Link
              href="/trainee/resources"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300 transition-colors group"
            >
              <Library className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <p className="font-bold text-slate-200 truncate">Resources</p>
                <p className="text-[10px] text-slate-500">Manuals & SOPs</p>
              </div>
            </Link>

            <Link
              href="/trainee/assessments"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300 transition-colors group"
            >
              <ClipboardList className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <p className="font-bold text-slate-200 truncate">Assessments</p>
                <p className="text-[10px] text-slate-500">Certification tests</p>
              </div>
            </Link>

            <Link
              href="/trainee/revision"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300 transition-colors group"
            >
              <RotateCcw className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <p className="font-bold text-slate-200 truncate">Smart Revision</p>
                <p className="text-[10px] text-slate-500">Adaptive practice</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
