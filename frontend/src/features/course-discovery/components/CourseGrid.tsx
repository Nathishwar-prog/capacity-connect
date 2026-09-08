'use client';

import React from 'react';
import { BookOpen, SearchX, RotateCcw } from 'lucide-react';
import { CourseSummary } from '../types/course-discovery.types';
import { CourseCard } from './CourseCard';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

interface Props {
  courses: CourseSummary[];
  isLoading: boolean;
  onViewDetails: (courseId: string) => void;
  onEnrollPrompt: (course: CourseSummary) => void;
  onResetFilters: () => void;
  isEnrolling: boolean;
}

export const CourseGrid: React.FC<Props> = ({
  courses,
  isLoading,
  onViewDetails,
  onEnrollPrompt,
  onResetFilters,
  isEnrolling,
}) => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="h-72 bg-slate-200/70 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">{t.noCoursesFound}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{t.noCoursesSub}</p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.resetFilters}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onViewDetails={onViewDetails}
          onEnrollPrompt={onEnrollPrompt}
          isEnrolling={isEnrolling}
        />
      ))}
    </div>
  );
};
