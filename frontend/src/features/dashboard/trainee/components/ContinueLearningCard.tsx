'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

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
  urgentRevision?: {
    topicName: string;
    reason: string;
    forgettingRisk: string;
  } | null;
  pendingAssessment?: {
    title: string;
    durationMinutes?: number;
    assessmentId: string;
  } | null;
}

export const ContinueLearningCard: React.FC<ContinueLearningProps> = ({
  course,
  urgentRevision,
  pendingAssessment,
}) => {
  if (!course) {
    return (
      <Card
        id="continue-learning"
        className="p-8 text-center bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-sm"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Recommended Action
          </span>
          <h3 className="text-lg font-bold text-slate-900 pt-1">You&apos;re Ready to Start Learning</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Explore the official MoES / IMD capacity-building catalog and choose your next meteorological development pathway.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/trainee/courses">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs px-5 py-2.5 rounded-xl">
              <span>Explore Course Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
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
      className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-indigo-900/60"
    >
      {/* Visual glowing depth effects */}
      <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 -mb-12 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-4 max-w-3xl">
          {/* Priority Ribbon */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Priority 1 • Recommended Next Step
            </span>
            <span className="text-xs text-slate-300 font-semibold px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">
              {course.category}
            </span>
            <span className="text-xs text-indigo-200 font-medium px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40">
              {course.difficulty} Level
            </span>
          </div>

          {/* Main Titles */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
              {course.courseTitle}
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-200/90 font-medium mt-1.5 flex-wrap">
              <span className="text-slate-400">{course.currentModuleTitle}</span>
              <span className="text-slate-600">•</span>
              <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                {course.currentLessonTitle}
              </span>
              <span className="text-slate-400 text-xs">({course.currentLessonType})</span>
            </div>
          </div>

          {/* Detailed Progress Bar */}
          <div className="space-y-2 pt-1 max-w-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Syllabus Completion</span>
              <span className="text-white font-black text-sm">{Math.round(course.progressPercentage)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800/90 border border-slate-700/70 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-xs shadow-cyan-500/50"
                style={{ width: `${Math.max(6, course.progressPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {Math.round(course.progressPercentage)}% verified progress
              </span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Last study activity: {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Secondary Explainable Alerts if available */}
          {urgentRevision && (
            <div className="inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-purple-950/70 border border-purple-800/60 text-purple-200 text-[11px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>
                Adaptive Revision Recommended: <strong>{urgentRevision.topicName}</strong> (Forgetting Risk: {urgentRevision.forgettingRisk})
              </span>
            </div>
          )}
        </div>

        {/* CTA Container */}
        <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0 lg:pl-4">
          <Link href={`/trainee/courses/${course.courseId}`} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 py-5 px-7 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Learning</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <span className="text-[11px] text-indigo-300/80 text-center sm:text-right font-medium">
            Next up: ~15 min study session
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContinueLearningCard;
