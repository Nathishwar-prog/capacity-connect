'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  useCourseOutline,
  useLessonDetail,
  useCompleteLesson,
} from '@/features/trainee/courses/hooks/useCourseViewer';
import {
  CourseViewerHeader,
  CourseOutlineSidebar,
  LessonObjectivesCard,
  KeyTakeawaysCard,
  LessonContentRenderer,
  LessonResourcesSection,
  InteractiveKnowledgeCheck,
  LessonNavigationFooter,
  CourseViewerSkeleton,
} from '@/features/trainee/courses/components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Clock, BookOpen, Layers } from 'lucide-react';

export default function TraineeLmsPlayerPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <LmsPlayerContent />
    </ProtectedRoute>
  );
}

function LmsPlayerContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  // Scroll container ref to preserve scroll behavior on lesson change
  const mainContentRef = useRef<HTMLDivElement>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Server Queries
  const {
    data: outlineData,
    isLoading: isOutlineLoading,
    isError: isOutlineError,
    refetch: refetchOutline,
  } = useCourseOutline(courseId);

  const {
    data: lessonDetail,
    isLoading: isLessonLoading,
    isError: isLessonError,
    refetch: refetchLesson,
  } = useLessonDetail(courseId, lessonId);

  // Optimistic Completion Mutation
  const completeMutation = useCompleteLesson(courseId);

  // Scroll to top when changing lessons
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lessonId]);

  // Handle Mark Complete toggle
  const handleToggleComplete = useCallback(() => {
    if (!lessonId) return;
    completeMutation.mutate(lessonId);
  }, [lessonId, completeMutation]);

  // Handle Complete & Continue navigation
  const handleCompleteAndContinue = useCallback(() => {
    if (!lessonId) return;

    // Optimistically mark current lesson complete
    completeMutation.mutate(lessonId);

    // Auto-advance to next lesson immediately
    if (lessonDetail?.nextLessonId) {
      router.push(`/trainee/courses/${courseId}/learn/${lessonDetail.nextLessonId}`);
    }
  }, [lessonId, lessonDetail?.nextLessonId, courseId, completeMutation, router]);

  // Toggle Sidebar
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Skeletons on initial load
  if (isOutlineLoading) {
    return <CourseViewerSkeleton />;
  }

  // Course Error State (e.g. not enrolled or invalid course ID)
  if (isOutlineError || !outlineData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-5 bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-white">Course Unavailable</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We could not load this course. You may need an active enrollment or verification
              from your training administrator.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOutline()}
              className="border-slate-700 text-xs text-slate-300 hover:text-white"
            >
              Try Again
            </Button>
            <Link href="/trainee/courses">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                Back to Catalog
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Derive active status
  const isLessonCompleted = Boolean(lessonDetail?.isCompleted);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* =====================================================================
          1. COURSE VIEWER HEADER
          ===================================================================== */}
      <CourseViewerHeader
        courseId={courseId}
        courseTitle={outlineData.course.title}
        moduleTitle={lessonDetail?.moduleTitle}
        lessonTitle={lessonDetail?.title}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        isCompleted={isLessonCompleted}
        onToggleComplete={handleToggleComplete}
        isPending={completeMutation.isPending}
        completedCount={outlineData.progress.completedLessonsCount}
        totalCount={outlineData.progress.totalLessonsCount}
        progressPercentage={outlineData.progress.progressPercentage}
      />

      {/* =====================================================================
          2. MAIN BODY (Sidebar + Center Content)
          ===================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Course Outline Sidebar */}
        <CourseOutlineSidebar
          courseId={courseId}
          outlineData={outlineData}
          activeLessonId={lessonId}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />

        {/* Center Lesson Viewer Area */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto bg-slate-900/40 p-4 sm:p-8 lg:p-12 custom-scrollbar transition-all"
        >
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {isLessonLoading ? (
              // Lesson content loading skeleton
              <div className="space-y-6 animate-pulse">
                <div className="space-y-3 pb-6 border-b border-slate-800">
                  <div className="w-32 h-3 rounded bg-slate-800" />
                  <div className="w-2/3 h-8 rounded-lg bg-slate-800" />
                  <div className="w-full h-4 rounded bg-slate-800/60" />
                </div>
                <div className="w-full h-32 rounded-2xl bg-slate-900 border border-slate-800" />
                <div className="space-y-3">
                  <div className="w-full h-4 rounded bg-slate-800/60" />
                  <div className="w-5/6 h-4 rounded bg-slate-800/60" />
                  <div className="w-4/5 h-4 rounded bg-slate-800/60" />
                </div>
              </div>
            ) : isLessonError || !lessonDetail ? (
              // Lesson Error State
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Lesson Content Unavailable</h3>
                <p className="text-xs text-slate-400">
                  We couldn't load the content for this specific lesson. Please try refreshing or
                  navigate to another lesson.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchLesson()}
                    className="border-slate-800 text-xs text-slate-300 hover:text-white"
                  >
                    Retry Lesson
                  </Button>
                  <Link href={`/trainee/courses/${courseId}`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                      Course Home
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              // ===============================================================
              // 3. STRUCTURED LESSON CONTENT
              // ===============================================================
              <>
                {/* Lesson Header & Metadata */}
                <div className="space-y-3 border-b border-slate-800/80 pb-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-indigo-400">
                    <span className="truncate">{lessonDetail.moduleTitle}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400 lowercase">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {lessonDetail.durationMinutes || 10} min read
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {lessonDetail.title}
                  </h1>

                  {lessonDetail.description && (
                    <p className="text-sm text-slate-300/90 leading-relaxed font-normal">
                      {lessonDetail.description}
                    </p>
                  )}
                </div>

                {/* Learning Objectives */}
                {lessonDetail.learningObjectives && lessonDetail.learningObjectives.length > 0 && (
                  <LessonObjectivesCard objectives={lessonDetail.learningObjectives} />
                )}

                {/* Structured Educational Content Blocks */}
                <div className="py-2">
                  <LessonContentRenderer content={lessonDetail.content} />
                </div>

                {/* Key Takeaways */}
                {lessonDetail.keyTakeaways && lessonDetail.keyTakeaways.length > 0 && (
                  <KeyTakeawaysCard takeaways={lessonDetail.keyTakeaways} />
                )}

                {/* Attached Resources */}
                {lessonDetail.resources && lessonDetail.resources.length > 0 && (
                  <LessonResourcesSection resources={lessonDetail.resources} />
                )}

                {/* Interactive Knowledge Checks */}
                {lessonDetail.knowledgeChecks && lessonDetail.knowledgeChecks.length > 0 && (
                  <InteractiveKnowledgeCheck
                    courseId={courseId}
                    lessonId={lessonId}
                    questions={lessonDetail.knowledgeChecks}
                  />
                )}

                {/* Bottom Navigation */}
                <LessonNavigationFooter
                  courseId={courseId}
                  prevLessonId={lessonDetail.prevLessonId}
                  nextLessonId={lessonDetail.nextLessonId}
                  isCompleted={isLessonCompleted}
                  onCompleteAndContinue={handleCompleteAndContinue}
                  onMarkComplete={handleToggleComplete}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
