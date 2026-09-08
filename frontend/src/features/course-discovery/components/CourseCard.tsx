'use client';

import React from 'react';
import { Clock, BookOpen, User, CheckCircle, ChevronRight, Plus } from 'lucide-react';
import { CourseSummary } from '../types/course-discovery.types';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

interface Props {
  course: CourseSummary;
  onViewDetails: (courseId: string) => void;
  onEnrollPrompt: (course: CourseSummary) => void;
  isEnrolling: boolean;
}

export const CourseCard: React.FC<Props> = ({
  course,
  onViewDetails,
  onEnrollPrompt,
  isEnrolling,
}) => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  const durationHours = Math.round(course.durationMinutes / 60);

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ');

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'BEGINNER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ADVANCED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OPERATIONAL':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        {/* Category & Difficulty Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
            {formatCategory(course.category)}
          </span>
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getDifficultyColor(
              course.difficulty,
            )}`}
          >
            {course.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(course.id)}
          className="text-base font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors cursor-pointer"
        >
          {course.title}
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>

        {/* Trainer info */}
        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold pt-1">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
            <User className="w-3 h-3" />
          </div>
          <span className="truncate">{course.trainer.name}</span>
        </div>
      </div>

      {/* Metadata & Actions Footer */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {durationHours} {t.hours}
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span>
              {course.lessonsCount || 20} {t.lessons}
            </span>
          </span>
        </div>

        {/* Dual Actions: View Details & Enroll */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onViewDetails(course.id)}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <span>{t.viewDetails}</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {course.isEnrolled ? (
            <div className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.alreadyEnrolled}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEnrollPrompt(course)}
              disabled={isEnrolling}
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.enrollNow}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
