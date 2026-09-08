'use client';

import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TraineeCoursesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
          <BookOpen className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Future Development Scope
            </span>
            <span className="text-xs text-slate-400 font-medium">Development 2+</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Courses Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            This route serves as a navigation placeholder for the Trainee Course Enrollment &
            Learning modules within the Ministry of Earth Sciences capacity framework. Active
            learning functionality will be implemented in subsequent development phases.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
          <Link
            href="/trainee/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
