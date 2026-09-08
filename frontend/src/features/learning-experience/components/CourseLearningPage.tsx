'use client';

import React, { useState } from 'react';
import { Layers, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLearningCourse } from '../hooks/useLearningCourse';
import { LearningProgressHeader } from './LearningProgressHeader';
import { CourseStructureSidebar } from './CourseStructureSidebar';
import { LessonViewer } from './LessonViewer';
import { LessonNavigation } from './LessonNavigation';
import { CourseCompletedBanner } from './CourseCompletedBanner';
import { UnauthorizedState } from './UnauthorizedState';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  courseId: string;
  initialLessonId?: string;
}

export const CourseLearningPage: React.FC<Props> = ({ courseId, initialLessonId }) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const {
    course,
    lesson,
    activeLessonId,
    selectLesson,
    isLoadingCourse,
    isErrorCourse,
    isLoadingLesson,
    isErrorLesson,
    previousLesson,
    nextLesson,
    isFinalLesson,
    goToNextLesson,
    goToPreviousLesson,
    completedLessonIds,
    completedCount,
    totalCount,
    overallProgress,
    isCourseCompleted,
    markLessonComplete,
    isCompleting,
  } = useLearningCourse(courseId, initialLessonId);

  // Loading State
  if (isLoadingCourse) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs sm:text-sm font-semibold text-slate-500">{t.loadingCourse}</p>
      </div>
    );
  }

  // Unauthorized / Unenrolled state
  if (!course) {
    return <UnauthorizedState />;
  }

  const isCurrentLessonCompleted = Boolean(
    activeLessonId && completedLessonIds.has(activeLessonId),
  );

  const handleCompleteCurrentLesson = async () => {
    if (!activeLessonId) return;
    await markLessonComplete(activeLessonId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Progress Bar & Meta */}
      <LearningProgressHeader
        course={course}
        completedCount={completedCount}
        totalCount={totalCount}
        progressPercentage={overallProgress}
      />

      {/* Course Completed Notification Banner */}
      {isCourseCompleted && <CourseCompletedBanner courseTitle={course.title} />}

      {/* Mobile Drawer Trigger Button */}
      <div className="lg:hidden flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600"
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{t.courseContent}</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount}
          </span>
        </button>
      </div>

      {/* Mobile Sidebar Dropdown */}
      {mobileSidebarOpen && (
        <div className="lg:hidden animate-in fade-in duration-150">
          <CourseStructureSidebar
            modules={course.modules}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            onSelectLesson={(id) => {
              selectLesson(id);
              setMobileSidebarOpen(false);
            }}
          />
        </div>
      )}

      {/* 2. Main 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course Structure Sidebar (Desktop only) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <CourseStructureSidebar
            modules={course.modules}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            onSelectLesson={selectLesson}
          />
        </div>

        {/* Right Column: Main Lesson Viewer & Content Viewport */}
        <div className="lg:col-span-8 space-y-6">
          {isLoadingLesson ? (
            <div className="min-h-[400px] bg-white border border-slate-200/80 rounded-3xl flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">{t.loadingLesson}</p>
            </div>
          ) : lesson ? (
            <>
              <LessonViewer lesson={lesson} onLessonEnded={handleCompleteCurrentLesson} />

              {/* 3. Sticky Bottom Action Bar */}
              <LessonNavigation
                previousLesson={previousLesson}
                nextLesson={nextLesson}
                isCompleted={isCurrentLessonCompleted}
                isCompleting={isCompleting}
                onPrevious={goToPreviousLesson}
                onNext={goToNextLesson}
                onComplete={handleCompleteCurrentLesson}
              />
            </>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">{t.errorLoadingLesson}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
