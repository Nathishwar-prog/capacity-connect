'use client';

import React from 'react';
import Link from 'next/link';
import { Play, BookOpen, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface ContinueLearningProps {
  course: {
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    slug: string;
    category: string;
    difficulty: string;
    progressPercentage: number;
    currentModuleTitle: string;
    currentLessonTitle: string;
    currentLessonType: string;
    lastActivityDate: string;
  } | null;
}

export const ContinueLearningCard: React.FC<ContinueLearningProps> = ({ course }) => {
  if (!course) {
    return (
      <Card
        id="continue-learning"
        className="p-8 text-center bg-white border border-slate-200/90 rounded-3xl space-y-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Ready to Start Learning?</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You are not currently active in any courses. Browse the MoES / IMD curriculum catalog
            and enroll in your first meteorological capacity building module.
          </p>
        </div>
        <Link href="/trainee/courses">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            <span>Explore Course Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </Card>
    );
  }

  const formattedDate = new Date(course.lastActivityDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      id="continue-learning"
      className="p-6 sm:p-7 rounded-3xl bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden border border-indigo-800/60"
    >
      {/* Subtle decorative background circle */}
      <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Continue Learning
            </span>
            <span className="text-xs text-indigo-200 font-medium">
              {course.category} • {course.difficulty}
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {course.courseTitle}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80 font-medium mt-1">
              {course.currentModuleTitle} •{' '}
              <span className="text-white font-bold">{course.currentLessonTitle}</span>
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold text-indigo-200">
              <span>Overall Course Progress</span>
              <span className="text-white">{Math.round(course.progressPercentage)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all"
                style={{ width: `${Math.max(5, course.progressPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-indigo-300/80 pt-0.5">
              <span>{Math.round(course.progressPercentage)}% complete</span>
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>Last accessed {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3 shrink-0">
          <Link href={`/trainee/courses/${course.courseId}`}>
            <Button
              size="lg"
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs sm:text-sm shadow-sm py-5 px-6 rounded-2xl"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              <span>Resume Learning</span>
            </Button>
          </Link>
          <span className="text-[11px] text-indigo-300 text-center font-medium">
            Next lesson type: {course.currentLessonType}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContinueLearningCard;
