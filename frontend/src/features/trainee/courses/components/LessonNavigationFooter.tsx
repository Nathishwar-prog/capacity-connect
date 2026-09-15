'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Check, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LessonNavigationFooterProps {
  courseId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  isCompleted: boolean;
  onCompleteAndContinue: () => void;
  onMarkComplete: () => void;
}

export const LessonNavigationFooter = React.memo(function LessonNavigationFooter({
  courseId,
  prevLessonId,
  nextLessonId,
  isCompleted,
  onCompleteAndContinue,
  onMarkComplete,
}: LessonNavigationFooterProps) {
  return (
    <div className="pt-8 mt-12 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
      {/* Previous Lesson Link */}
      {prevLessonId ? (
        <Link href={`/trainee/courses/${courseId}/learn/${prevLessonId}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-2 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Lesson</span>
          </Button>
        </Link>
      ) : (
        <div />
      )}

      {/* Center / Right: Complete & Continue / Next Lesson */}
      <div className="flex items-center gap-3">
        {nextLessonId ? (
          <>
            {!isCompleted ? (
              <Button
                size="sm"
                onClick={onCompleteAndContinue}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-950/50 transition-all"
              >
                <span>Complete & Continue</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Link href={`/trainee/courses/${courseId}/learn/${nextLessonId}`}>
                <Button
                  size="sm"
                  className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs gap-2 border border-slate-700/60 shadow-sm transition-all"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </>
        ) : (
          <Button
            size="sm"
            onClick={onMarkComplete}
            className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-950/50 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>{isCompleted ? 'Course Completed' : 'Complete Course'}</span>
          </Button>
        )}
      </div>
    </div>
  );
});
