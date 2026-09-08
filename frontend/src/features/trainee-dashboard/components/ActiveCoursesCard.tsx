'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, User, ArrowRight, PlayCircle, Clock } from 'lucide-react';
import { ActiveCourseItem } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface ActiveCoursesCardProps {
  courses: ActiveCourseItem[];
}

export const ActiveCoursesCard: React.FC<ActiveCoursesCardProps> = ({ courses }) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{t.activeCourses}</h2>
            <p className="text-xs text-slate-500 font-medium">{t.activeCoursesSubtitle}</p>
          </div>
        </div>

        <Link
          href="/trainee/courses"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors hidden sm:inline-block"
        >
          View All ({courses.length})
        </Link>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
          {t.noActiveCourses}
        </div>
      ) : (
        <div className="space-y-3.5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Course Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {course.category}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {t.inProgressBadge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                  {course.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {course.trainerName} ({course.trainerDesignation})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{course.lastActivityDate}</span>
                  </div>
                </div>

                {/* Progress bar inside course card */}
                <div className="pt-1 max-w-md space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span className="truncate text-slate-500 text-[10px]">
                      {course.currentLessonTitle}
                    </span>
                    <span>{course.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${course.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-start md:self-center">
                <Link
                  href={`/trainee/courses`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs group/btn"
                >
                  <PlayCircle className="w-4 h-4 text-sky-400" />
                  <span>{t.continueLearning}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveCoursesCard;
