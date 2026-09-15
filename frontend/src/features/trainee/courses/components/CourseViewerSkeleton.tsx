import React from 'react';

export function CourseViewerSkeleton() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-slate-800/80 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-800" />
          <div className="w-8 h-8 rounded-lg bg-slate-800" />
          <div className="space-y-1.5">
            <div className="w-48 h-4 rounded bg-slate-800" />
            <div className="w-32 h-3 rounded bg-slate-800/60" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-24 h-3 rounded bg-slate-800" />
            <div className="w-32 h-2 rounded bg-slate-800" />
          </div>
          <div className="w-28 h-9 rounded-lg bg-slate-800" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-84 border-r border-slate-800/80 bg-slate-900/40 p-4 space-y-4 hidden md:block">
          <div className="w-full h-9 rounded-xl bg-slate-800/60" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-2">
                <div className="w-3/4 h-3.5 rounded bg-slate-800" />
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-3 rounded bg-slate-800/60" />
                  <div className="w-5/6 h-3 rounded bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto max-w-4xl mx-auto space-y-8 w-full">
          <div className="space-y-3 pb-6 border-b border-slate-800/80">
            <div className="w-40 h-3.5 rounded bg-slate-800" />
            <div className="w-3/4 h-8 rounded-lg bg-slate-800" />
            <div className="w-full h-4 rounded bg-slate-800/60" />
          </div>

          <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
            <div className="w-36 h-4 rounded bg-indigo-900/40" />
            <div className="w-5/6 h-3 rounded bg-indigo-900/30" />
            <div className="w-2/3 h-3 rounded bg-indigo-900/30" />
          </div>

          <div className="space-y-4 pt-2">
            <div className="w-full h-4 rounded bg-slate-800/60" />
            <div className="w-full h-4 rounded bg-slate-800/60" />
            <div className="w-4/5 h-4 rounded bg-slate-800/60" />
            <div className="w-full h-32 rounded-xl bg-slate-900 border border-slate-800/60" />
            <div className="w-full h-4 rounded bg-slate-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
