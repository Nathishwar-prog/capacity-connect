'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, User, CheckCircle2, Award } from 'lucide-react';
import { CourseLearningOverview } from '../types/learning-experience.types';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  course: CourseLearningOverview;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

export const LearningProgressHeader: React.FC<Props> = ({
  course,
  completedCount,
  totalCount,
  progressPercentage,
}) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  const durationHours = Math.round(course.durationMinutes / 60);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top row: Breadcrumb navigation & Meta tags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link
            href="/trainee/courses"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToCourses}</span>
          </Link>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-xs">{course.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
            {course.category.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {course.difficulty}
          </span>
          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>WMO-258</span>
          </span>
        </div>
      </div>

      {/* Main Header Information & Progress bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {course.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.trainer.name}</span>
            </span>
            <span>•</span>
            <span className="text-slate-500">{course.trainer.organizationName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{durationHours} hrs total</span>
            </span>
          </div>
        </div>

        {/* Progress Display Block */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:min-w-64 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.courseProgress}</span>
            </span>
            <span className="text-blue-700 font-black text-sm">{progressPercentage}%</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                progressPercentage === 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}
              style={{ width: `${Math.max(3, progressPercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
            <span>
              {completedCount} / {totalCount} {t.lessonsCompleted}
            </span>
            <span className="font-semibold text-slate-700">
              {course.totalModules} {t.modulesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
