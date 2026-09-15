'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTrainerCourse } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Eye,
  BookOpen,
  Layers,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Play,
  FileText,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Compass,
  Check,
  ShieldAlert,
} from 'lucide-react';

export default function CoursePreviewPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <CoursePreviewContent />
    </ProtectedRoute>
  );
}

function CoursePreviewContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useTrainerCourse(courseId);

  // Selected view: 'OVERVIEW' | lessonId | assessmentId
  const [selectedView, setSelectedView] = useState<'OVERVIEW' | string>('OVERVIEW');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <span className="text-xs text-slate-400">Loading curriculum preview simulator...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="p-8 rounded-3xl bg-slate-800 border border-slate-700 text-center max-w-md space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold">Course Not Found</h2>
          <p className="text-xs text-slate-400">
            The requested course could not be located or you are not authorized to preview it.
          </p>
          <Link href="/trainer/courses">
            <Button size="sm" variant="outline" className="text-xs mt-3 text-white border-slate-600 hover:bg-slate-700">
              Return to My Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const modules = course.modules || [];
  const assessments = course.assessments || [];
  const competencies = course.courseCompetencies || [];

  // Flatten lessons for linear navigation
  const allLessons = modules.flatMap((m) =>
    (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))
  );

  const currentLessonIndex = allLessons.findIndex((l) => l.id === selectedView);
  const currentLesson = currentLessonIndex !== -1 ? allLessons[currentLessonIndex] : null;
  const currentAssessment = assessments.find((a) => a.id === selectedView);

  const handleNext = () => {
    if (selectedView === 'OVERVIEW' && allLessons.length > 0) {
      setSelectedView(allLessons[0].id);
      setActiveModuleId(allLessons[0].moduleId);
    } else if (currentLessonIndex !== -1 && currentLessonIndex < allLessons.length - 1) {
      const next = allLessons[currentLessonIndex + 1];
      setSelectedView(next.id);
      setActiveModuleId(next.moduleId);
    } else if (currentLessonIndex === allLessons.length - 1 && assessments.length > 0) {
      setSelectedView(assessments[0].id);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      const prev = allLessons[currentLessonIndex - 1];
      setSelectedView(prev.id);
      setActiveModuleId(prev.moduleId);
    } else if (currentLessonIndex === 0) {
      setSelectedView('OVERVIEW');
    } else if (currentAssessment && allLessons.length > 0) {
      const last = allLessons[allLessons.length - 1];
      setSelectedView(last.id);
      setActiveModuleId(last.moduleId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* ── TOP PREVIEW MODE BANNER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-amber-500/15 border-b border-amber-500/30 backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Preview Mode</span>
          </div>
          <span className="text-amber-300 font-medium hidden sm:inline">
            Trainee experience simulation — No learner completions or activity are tracked.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/trainer/courses/${course.id}/builder`}>
            <Button size="sm" variant="outline" className="text-xs h-7 bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700">
              <ArrowLeft className="w-3 h-3 mr-1" />
              <span>Back to Builder</span>
            </Button>
          </Link>
          <Link href="/trainer/courses">
            <Button size="sm" className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <span>Exit Preview</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── LEFT NAVIGATION SIDEBAR (Curriculum Hierarchy) ────────────────── */}
        <aside className="w-full md:w-80 bg-slate-950/80 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto max-h-[calc(100vh-45px)]">
          <div className="p-4 border-b border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-400 border-indigo-500/30">
                {course.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                {course.category}
              </Badge>
            </div>
            <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug">
              {course.title}
            </h2>
          </div>

          <div className="p-2 space-y-1">
            {/* Overview Item */}
            <button
              onClick={() => setSelectedView('OVERVIEW')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                selectedView === 'OVERVIEW'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Course Overview</span>
            </button>

            {/* Modules Accordion */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block">
                Modules & Lessons ({allLessons.length})
              </span>

              {modules.map((module, mIdx) => {
                const isExpanded = activeModuleId === module.id || (currentLesson && currentLesson.moduleId === module.id);
                return (
                  <div key={module.id} className="rounded-xl bg-slate-900/40 border border-slate-800/60 overflow-hidden">
                    <button
                      onClick={() => setActiveModuleId(isExpanded ? null : module.id)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {mIdx + 1}
                        </span>
                        <span className="truncate">{module.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-1 pl-4 space-y-0.5 bg-slate-950/40 border-t border-slate-800/40">
                        {(module.lessons || []).map((lesson, lIdx) => {
                          const isSelected = selectedView === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setSelectedView(lesson.id);
                                setActiveModuleId(module.id);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                              }`}
                            >
                              <span className="text-[10px] opacity-60 font-mono">
                                {mIdx + 1}.{lIdx + 1}
                              </span>
                              <span className="truncate flex-1">{lesson.title}</span>
                              {lesson.durationMinutes && (
                                <span className="text-[10px] opacity-60 shrink-0">
                                  {lesson.durationMinutes}m
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Assessments */}
            {assessments.length > 0 && (
              <div className="pt-2 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block">
                  Assessments ({assessments.length})
                </span>
                {assessments.map((ass) => {
                  const isSelected = selectedView === ass.id;
                  return (
                    <button
                      key={ass.id}
                      onClick={() => setSelectedView(ass.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate">{ass.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT VIEWER ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/50 flex flex-col justify-between">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* 1. COURSE OVERVIEW VIEW */}
            {selectedView === 'OVERVIEW' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs">
                      {course.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                      {course.difficulty}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {allLessons.length} lessons • {course.durationMinutes || 120} minutes total
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {course.title}
                  </h1>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {course.description}
                  </p>

                  <div className="pt-2">
                    <Button
                      onClick={handleNext}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      <span>Start Learning Course</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Course Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Competencies */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      <span>Target Meteorological Competencies</span>
                    </div>
                    {competencies.length === 0 ? (
                      <p className="text-xs text-slate-500">No competency framework attached yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {competencies.map((cc) => (
                          <div
                            key={cc.id}
                            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-slate-200">{cc.competency?.name}</span>
                            <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/30">
                              Target Level: {cc.targetLevel}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modules Overview */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      <Layers className="w-4 h-4" />
                      <span>Curriculum Breakdown</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {modules.map((m, idx) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-300 truncate">
                            {idx + 1}. {m.title}
                          </span>
                          <span className="text-slate-500 text-[11px] shrink-0">
                            {m.lessons?.length || 0} lessons
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. LESSON VIEW */}
            {currentLesson && (
              <div className="space-y-6 animate-in fade-in">
                {/* Lesson Header */}
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/30">
                      {currentLesson.moduleTitle}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                      {currentLesson.contentType || 'ARTICLE'}
                    </Badge>
                    {currentLesson.durationMinutes && (
                      <span className="text-[11px] text-slate-400">
                        {currentLesson.durationMinutes} min read
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {currentLesson.title}
                  </h1>

                  {currentLesson.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  )}
                </div>

                {/* Simulated Lesson Player / Reader */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
                  {currentLesson.contentType === 'VIDEO' ? (
                    <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-3 p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <Play className="w-8 h-8 ml-1" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">
                        Video Simulation: {currentLesson.title}
                      </span>
                      <span className="text-[11px] text-slate-500 max-w-sm">
                        In trainee mode, the video player streams atmospheric radar imagery and lecture materials with auto-bookmarking.
                      </span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300 leading-relaxed">
                      {currentLesson.content ? (
                        <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                          {currentLesson.content}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-xs">
                          No text body entered for this lesson. Open Course Builder to add text content blocks.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Learning Objectives */}
                  {Array.isArray((currentLesson as any).learningObjectives) && (currentLesson as any).learningObjectives.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 space-y-2">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Learning Objectives
                      </span>
                      <ul className="space-y-1.5">
                        {(currentLesson as any).learningObjectives.map((obj: string, idx: number) => (
                          <li key={idx} className="text-xs text-indigo-200 flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ASSESSMENT VIEW */}
            {currentAssessment && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs">
                    Assessment Simulation
                  </Badge>
                  <h1 className="text-2xl font-black text-white">{currentAssessment.title}</h1>
                  <p className="text-xs text-slate-400">
                    Subject: {currentAssessment.subject} • Passing Score: {currentAssessment.passingScore}%
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 text-center py-10">
                  <HelpCircle className="w-12 h-12 text-purple-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Assessment Preview</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Trainees take this timed evaluation upon module completion. Questions are evaluated against the institutional passing threshold of {currentAssessment.passingScore}%.
                  </p>
                  <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                    Duration: {currentAssessment.durationMinutes || 30} minutes
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM LINEAR NAVIGATION ──────────────────────────────────── */}
          <footer className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrev}
              disabled={selectedView === 'OVERVIEW'}
              className="text-xs bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous</span>
            </Button>

            <span className="text-[11px] text-slate-500">
              {currentLessonIndex !== -1
                ? `Lesson ${currentLessonIndex + 1} of ${allLessons.length}`
                : selectedView === 'OVERVIEW'
                ? 'Curriculum Overview'
                : 'Assessment Mode'}
            </span>

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </footer>
        </main>
      </div>
    </div>
  );
}
