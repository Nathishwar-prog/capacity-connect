'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { apiClient } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  HelpCircle,
  Sparkles,
  Award,
  Check,
  X,
  Loader2,
  Menu,
} from 'lucide-react';

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

  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Quiz state: questionId -> { selectedOpt: string, isSubmitted: boolean, isCorrect: boolean }
  const [quizState, setQuizState] = useState<Record<string, { selectedOpt: string; isSubmitted: boolean; isCorrect: boolean }>>({});
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Fetch course structure
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await apiClient.get(`/courses/${courseId}/structure`);
        setCourse(res.data.data);

        // Fetch completed progress if available
        try {
          const enrollRes = await apiClient.get(`/trainee/courses/${courseId}/progress`);
          if (enrollRes.data.data?.completedLessonIds) {
            setCompletedLessonIds(new Set(enrollRes.data.data.completedLessonIds));
          }
        } catch {
          // Non-blocking fallback
        }
      } catch {
        // Fallback to basic course endpoint
        try {
          const fallbackRes = await apiClient.get(`/courses/${courseId}`);
          setCourse(fallbackRes.data.data);
        } catch {
          // Failed to load
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-xs text-slate-400">Loading LMS Learning Player...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Course Not Found</h2>
          <p className="text-xs text-slate-500">The requested learning content could not be loaded.</p>
          <Link href="/trainee/courses">
            <Button size="sm" className="bg-indigo-600 text-white text-xs">
              Back to Catalog
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Flatten all lessons in order
  const allLessons: Array<{ lesson: any; module: any }> = [];
  (course.modules || []).forEach((mod: any) => {
    (mod.lessons || []).forEach((les: any) => {
      allLessons.push({ lesson: les, module: mod });
    });
  });

  const currentIndex = allLessons.findIndex((item) => item.lesson.id === lessonId);
  const currentItem = currentIndex >= 0 ? allLessons[currentIndex] : allLessons[0];
  const currentLesson = currentItem?.lesson;
  const currentModule = currentItem?.module;

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1].lesson : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].lesson : null;

  // Parse structured blocks
  let contentBlocks: any[] = [];
  if (currentLesson?.content) {
    try {
      const parsed = JSON.parse(currentLesson.content);
      if (Array.isArray(parsed)) contentBlocks = parsed;
    } catch {
      if (typeof currentLesson.content === 'string') {
        contentBlocks = [{ type: 'paragraph', content: currentLesson.content }];
      }
    }
  }

  // Handle Mark Complete
  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    setIsSubmittingEvent(true);

    const updatedSet = new Set(completedLessonIds);
    updatedSet.add(currentLesson.id);
    setCompletedLessonIds(updatedSet);

    try {
      // Emit learning event to feed competency and revision engine
      await apiClient.post('/learning-events', {
        courseId,
        lessonId: currentLesson.id,
        eventType: 'LESSON_COMPLETED',
        source: 'LMS_VIEWER',
      });
    } catch {
      // Non-blocking
    } finally {
      setIsSubmittingEvent(false);
      if (nextLesson) {
        router.push(`/trainee/courses/${courseId}/learn/${nextLesson.id}`);
      }
    }
  };

  // Handle Quiz Answer Submit
  const handleQuizAnswer = async (qId: string, opt: any, question: any) => {
    const isCorrect = Boolean(opt.isCorrect);

    setQuizState((prev) => ({
      ...prev,
      [qId]: {
        selectedOpt: opt.id || opt.text,
        isSubmitted: true,
        isCorrect,
      },
    }));

    try {
      // Emit real learning event for question attempt
      await apiClient.post('/learning-events', {
        courseId,
        lessonId: currentLesson.id,
        questionId: qId,
        eventType: 'QUIZ_ANSWERED',
        correct: isCorrect,
        responseTimeMs: 3200,
        confidenceRating: isCorrect ? 0.95 : 0.4,
        source: 'LMS_KNOWLEDGE_CHECK',
      });
    } catch {
      // Non-blocking
    }
  };

  const progressPercent = allLessons.length > 0
    ? Math.round((completedLessonIds.size / allLessons.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* =======================================================================
          LMS PLAYER HEADER
          ======================================================================= */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/trainee/courses/${courseId}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Course Details"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {course.title}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              {currentModule?.title} • {currentLesson?.title}
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-400">{progressPercent}% Completed</span>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleMarkComplete}
            disabled={isSubmittingEvent}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
          >
            {isSubmittingEvent ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{completedLessonIds.has(currentLesson?.id) ? 'Completed' : 'Mark Complete'}</span>
          </Button>
        </div>
      </header>

      {/* =======================================================================
          LMS MAIN BODY (Sidebar + Content View)
          ======================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Curriculum Navigation Sidebar */}
        {isSidebarOpen && (
          <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 h-full overflow-hidden transition-all duration-300">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Course Outline
              </span>
              <span className="text-[11px] text-slate-500">
                {completedLessonIds.size}/{allLessons.length} done
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {(course.modules || []).map((mod: any, mIdx: number) => (
                <div key={mod.id || mIdx} className="rounded-xl border border-slate-800/80 bg-slate-900/50 overflow-hidden">
                  <div className="p-2.5 bg-slate-900/90 font-bold text-xs text-slate-300 flex items-center justify-between">
                    <span className="truncate">{mod.title}</span>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {(mod.lessons || []).map((les: any, lIdx: number) => {
                      const isActive = les.id === lessonId;
                      const isDone = completedLessonIds.has(les.id);

                      return (
                        <Link
                          key={les.id || lIdx}
                          href={`/trainee/courses/${courseId}/learn/${les.id}`}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : isActive ? (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className="truncate">{les.title}</span>
                          </div>

                          <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                            {les.durationMinutes || 20}m
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Center Lesson Viewer Area */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-10">
          <div className="max-w-3xl mx-auto space-y-8 pb-16">
            {/* Lesson Title & Objectives */}
            <div className="space-y-3 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                <span>{currentModule?.title}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentLesson?.title}
              </h1>
              {currentLesson?.description && (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {currentLesson.description}
                </p>
              )}
            </div>

            {/* Learning Objectives Box */}
            {currentLesson?.learningObjectives && currentLesson.learningObjectives.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-2">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Lesson Objectives
                </h3>
                <ul className="text-xs text-indigo-100 space-y-1.5 list-disc list-inside">
                  {currentLesson.learningObjectives.map((obj: string, idx: number) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Educational Content Blocks */}
            <div className="space-y-6 text-slate-200 text-sm leading-relaxed">
              {contentBlocks.map((block: any, idx: number) => {
                if (block.type === 'heading') {
                  return (
                    <h2 key={idx} className="text-lg font-bold text-white tracking-tight pt-2 border-b border-slate-800 pb-1">
                      {block.content}
                    </h2>
                  );
                } else if (block.type === 'callout') {
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs">
                      <strong className="block font-bold uppercase tracking-wider text-[10px] text-amber-400 mb-1">
                        Operational Takeaway
                      </strong>
                      {block.content}
                    </div>
                  );
                } else if (block.type === 'example') {
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/60 text-blue-200 text-xs">
                      <strong className="block font-bold uppercase tracking-wider text-[10px] text-blue-400 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Real-World Application
                      </strong>
                      {block.content}
                    </div>
                  );
                } else if (block.type === 'table') {
                  return (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto font-mono text-xs text-slate-300 whitespace-pre">
                      {block.content}
                    </div>
                  );
                } else {
                  return (
                    <p key={idx} className="text-slate-300 leading-relaxed">
                      {block.content}
                    </p>
                  );
                }
              })}
            </div>

            {/* Key Takeaways Box */}
            {currentLesson?.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/60 space-y-2">
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Key Takeaways
                </h3>
                <ul className="text-xs text-emerald-100 space-y-1.5 list-disc list-inside">
                  {currentLesson.keyTakeaways.map((point: string, idx: number) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Knowledge Check / Assessment Section */}
            {currentLesson?.knowledgeChecks && currentLesson.knowledgeChecks.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  Interactive Knowledge Check
                </h3>

                {currentLesson.knowledgeChecks.map((qc: any, qIdx: number) => {
                  const state = quizState[qc.id];

                  return (
                    <div key={qc.id || qIdx} className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-slate-200">
                        {qIdx + 1}. {qc.question}
                      </p>

                      <div className="space-y-2">
                        {(qc.options || []).map((opt: any, oIdx: number) => {
                          const isSelected = state?.selectedOpt === (opt.id || opt.text);

                          let optionClass = 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700';
                          if (state?.isSubmitted) {
                            if (opt.isCorrect) {
                              optionClass = 'border-emerald-500 bg-emerald-950/50 text-emerald-200';
                            } else if (isSelected && !opt.isCorrect) {
                              optionClass = 'border-rose-500 bg-rose-950/50 text-rose-200';
                            }
                          } else if (isSelected) {
                            optionClass = 'border-indigo-500 bg-indigo-950/50 text-indigo-200';
                          }

                          return (
                            <button
                              key={opt.id || oIdx}
                              disabled={state?.isSubmitted}
                              onClick={() => handleQuizAnswer(qc.id, opt, qc)}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${optionClass}`}
                            >
                              <span>{opt.text}</span>
                              {state?.isSubmitted && opt.isCorrect && (
                                <Check className="w-4 h-4 text-emerald-400" />
                              )}
                              {state?.isSubmitted && isSelected && !opt.isCorrect && (
                                <X className="w-4 h-4 text-rose-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {state?.isSubmitted && (
                        <div
                          className={`p-3 rounded-xl text-xs ${
                            state.isCorrect
                              ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-900'
                              : 'bg-rose-950/40 text-rose-200 border border-rose-900'
                          }`}
                        >
                          {state.isCorrect ? (
                            <p className="font-bold">✓ Correct! Great job mastering this operational concept.</p>
                          ) : (
                            <p className="font-bold">✗ Incorrect. Review the section material above.</p>
                          )}
                          {qc.explanation && <p className="mt-1 text-[11px] opacity-90">{qc.explanation}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Lesson Navigation */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              {prevLesson ? (
                <Link href={`/trainee/courses/${courseId}/learn/${prevLesson.id}`}>
                  <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-white text-xs gap-1.5">
                    <ChevronLeft className="w-4 h-4" />
                    Previous Lesson
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link href={`/trainee/courses/${courseId}/learn/${nextLesson.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm">
                    Next Lesson
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={handleMarkComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  Complete Course
                  <Award className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
