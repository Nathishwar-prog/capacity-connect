'use client';

import React from 'react';
import { TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import { CourseProgressItem } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface CourseProgressCardProps {
  overallPercentage: number;
  courses: CourseProgressItem[];
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  overallPercentage,
  courses,
}) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.courseProgress}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{t.progressSubtitle}</p>
          </div>
        </div>

        {/* Overall Percentage Badge */}
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">{t.overallProgress}</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {overallPercentage}%
          </span>
        </div>
      </div>

      {/* Main Overall Progress Gauge */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Curriculum Velocity</span>
          <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
            {overallPercentage >= 70 ? 'On Track' : 'In Progress'}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Individual Courses Progress Bars */}
      <div className="space-y-4">
        {courses.map((item) => (
          <div key={item.courseId} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-slate-800 truncate">{item.courseTitle}</span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  ({item.completedLessons}/{item.totalLessons} lessons)
                </span>
              </div>
              <span className="font-extrabold text-slate-900 shrink-0">
                {item.progressPercentage}%
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  item.progressPercentage >= 70
                    ? 'bg-emerald-500'
                    : item.progressPercentage >= 40
                      ? 'bg-sky-500'
                      : 'bg-indigo-500'
                }`}
                style={{ width: `${item.progressPercentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseProgressCard;
