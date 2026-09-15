'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Menu, Check, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CourseViewerHeaderProps {
  courseId: string;
  courseTitle: string;
  moduleTitle?: string;
  lessonTitle?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
  isPending: boolean;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

export const CourseViewerHeader = React.memo(function CourseViewerHeader({
  courseId,
  courseTitle,
  moduleTitle,
  lessonTitle,
  isSidebarOpen,
  onToggleSidebar,
  isCompleted,
  onToggleComplete,
  isPending,
  completedCount,
  totalCount,
  progressPercentage,
}: CourseViewerHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shrink-0 z-30 shadow-md">
      {/* Left side: Back link, Sidebar toggle, Course & Lesson Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link
          href={`/trainee/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
          title="Back to Course Overview"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-semibold">Back to Course</span>
        </Link>

        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl border transition-colors shrink-0 ${
            isSidebarOpen
              ? 'border-slate-800 bg-slate-900 text-indigo-400 hover:bg-slate-800'
              : 'border-slate-800/60 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isSidebarOpen ? 'Collapse Outline' : 'Expand Outline'}
          aria-label="Toggle course outline"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5 sm:mx-1 shrink-0" />

        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 shrink-0">
              COURSE
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {courseTitle}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {moduleTitle ? `${moduleTitle} • ` : ''}
            <span className="text-slate-200 font-medium">{lessonTitle || 'Select Lesson'}</span>
          </p>
        </div>
      </div>

      {/* Right side: Progress Bar & Optimistic Completion Button */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {/* Progress Display */}
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">
              <strong className="text-white font-semibold">{completedCount}</strong> of{' '}
              <strong className="text-white font-semibold">{totalCount}</strong> lessons completed
            </span>
            <span className="font-bold text-indigo-400">({progressPercentage}%)</span>
          </div>

          <div className="w-32 md:w-44 bg-slate-800/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Optimistic Mark Complete / Completed Button */}
        <Button
          size="sm"
          onClick={onToggleComplete}
          className={`h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 transition-all shadow-sm ${
            isCompleted
              ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-500/40 shadow-emerald-950/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40'
          }`}
          title={isCompleted ? 'Completed (click to toggle)' : 'Mark this lesson as completed'}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>✓ Completed</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Mark Complete</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
});
