'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Compass,
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Video,
  FileText,
  FileCode,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Download,
  ExternalLink,
  Volume2,
  Maximize,
  Sparkles,
  HelpCircle,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface LessonResource {
  id: string;
  resource?: {
    id: string;
    title: string;
    fileType: string;
    fileUrl: string;
    fileSize?: number;
    description?: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  contentType: 'VIDEO' | 'ARTICLE' | 'DOCUMENT' | 'QUIZ' | 'SIMULATION' | string;
  content?: string | null;
  resourceUrl?: string | null;
  durationMinutes: number;
  orderIndex: number;
  isPreview?: boolean;
  lessonResources?: LessonResource[];
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  durationMinutes?: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  status: string;
  trainer?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    trainerProfile?: {
      designation?: string;
      organizationName?: string;
      bio?: string;
    };
  };
  modules: Module[];
  courseCompetencies: Array<{
    targetLevel: number;
    competency: {
      id: string;
      name: string;
      code: string;
      category?: string;
      description?: string;
    };
  }>;
  prerequisites?: Array<{
    prerequisiteCourse: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
}

export default function TraineeCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Completed lessons tracking
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Interactive Lesson Viewer State
  const [activeLesson, setActiveLesson] = useState<{
    lesson: Lesson;
    moduleTitle: string;
    moduleIndex: number;
    lessonIndex: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'SOP' | 'COMPETENCIES' | 'RESOURCES'>('CONTENT');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Simulated Video Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');
  const [videoProgress, setVideoProgress] = useState(35); // simulated percent

  useEffect(() => {
    if (id) fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    try {
      const [courseRes, enrollmentsRes] = await Promise.all([
        apiClient.get(`/courses/${id}`),
        apiClient.get('/enrollments').catch(() => ({ data: { data: [] } })),
      ]);

      let courseData: CourseDetail = courseRes.data?.data;

      // Pipeline Safeguard: If courseData has no modules, fetch structure directly from /courses/:id/structure
      if (!courseData?.modules || courseData.modules.length === 0) {
        try {
          const structRes = await apiClient.get(`/courses/${id}/structure`);
          if (structRes.data?.data?.modules?.length > 0) {
            courseData = {
              ...courseData,
              modules: structRes.data.data.modules,
            };
          }
        } catch {
          // fallback ignore
        }
      }

      setCourse(courseData);

      if (courseData?.modules?.length > 0) {
        setExpandedModule(courseData.modules[0].id);
      }

      const myEnrollments = enrollmentsRes.data?.data?.enrollments || enrollmentsRes.data?.data || [];
      const userEnrollment = myEnrollments.find(
        (e: any) => (e.courseId || e.course?.id) === id || e.course?.slug === id
      );

      if (userEnrollment) {
        setIsEnrolled(true);
        setEnrollmentId(userEnrollment.id);

        // Fetch detailed enrollment to populate completedLessonIds
        try {
          const enrDetailRes = await apiClient.get(`/enrollments/${userEnrollment.id}`);
          const enrData = enrDetailRes.data?.data;
          if (enrData?.lessonProgress && Array.isArray(enrData.lessonProgress)) {
            const completed = new Set<string>(
              enrData.lessonProgress
                .filter((lp: any) => lp.completed)
                .map((lp: any) => lp.lessonId)
            );
            setCompletedLessonIds(completed);
          }
        } catch {
          // fallback
        }
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!id || !course) return;
    setEnrolling(true);
    try {
      const res = await apiClient.post('/enrollments', { courseId: course.id });
      setIsEnrolled(true);
      if (res.data?.data?.id) {
        setEnrollmentId(res.data.data.id);
      }
      alert('Successfully enrolled! You now have full access to all curriculum modules.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    const lessonId = activeLesson.lesson.id;

    // Optimistically update local completed set
    setCompletedLessonIds((prev) => new Set([...prev, lessonId]));

    if (enrollmentId) {
      setUpdatingProgress(true);
      try {
        await apiClient.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/progress`, {
          completed: true,
          progressPercentage: 100,
        });
      } catch (err) {
        console.warn('Progress API sync notice:', err);
      } finally {
        setUpdatingProgress(false);
      }
    }
  };

  // Helper to find all flat lessons for sequential navigation
  const allLessons: Array<{ lesson: Lesson; moduleTitle: string; moduleIndex: number; lessonIndex: number }> = [];
  course?.modules?.forEach((mod, mIdx) => {
    mod.lessons?.forEach((les, lIdx) => {
      allLessons.push({
        lesson: les,
        moduleTitle: mod.title,
        moduleIndex: mIdx,
        lessonIndex: lIdx,
      });
    });
  });

  const currentLessonIndex = allLessons.findIndex((item) => item.lesson.id === activeLesson?.lesson.id);
  const prevLessonItem = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLessonItem = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = allLessons.filter((item) => completedLessonIds.has(item.lesson.id)).length;
  const verifiedProgressPercent = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          {/* Back button */}
          <Link
            href="/trainee/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Course Catalog</span>
          </Link>

          {loading && (
            <Card className="p-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading syllabus and course structure from MoES database...</p>
            </Card>
          )}

          {!loading && course && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                      {course.category}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 uppercase">
                      {course.difficulty} Level
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {Math.round(course.durationMinutes / 60)} Hours Curriculum
                    </span>
                  </div>

                  {isEnrolled && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Enrolled Trainee</span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {course.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {course.description}
                </p>

                {/* Progress Bar (If Enrolled) */}
                {isEnrolled && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 max-w-2xl">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-indigo-900">Your Course Completion</span>
                      <span className="text-indigo-700">{completedLessonsCount} / {totalLessonsCount} Lessons ({verifiedProgressPercent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-indigo-200 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, verifiedProgressPercent)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Trainer Information & Enrollment Button */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  {course.trainer ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {course.trainer.firstName[0]}
                        {course.trainer.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Dr. {course.trainer.firstName} {course.trainer.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {course.trainer.trainerProfile?.designation || 'Senior Scientist / Course Director'} • IMD Division
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium">
                      IMD National Weather Forecasting Centre (NWFC)
                    </div>
                  )}

                    <div className="flex items-center gap-2">
                      {isEnrolled ? (
                        <>
                          <Link
                            href={`/trainee/courses/${course.id}/learn/${allLessons[0]?.lesson?.id || ''}`}
                          >
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2">
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Launch LMS Player</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (allLessons.length > 0) {
                                setActiveLesson(allLessons[0]);
                              }
                            }}
                            className="text-xs font-bold px-3 py-2.5 rounded-xl border-slate-300 hover:bg-slate-100"
                          >
                            Quick View
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleEnroll}
                          disabled={enrolling}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
                        >
                          {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                        </Button>
                      )}
                    </div>
                </div>
              </div>

              {/* Prerequisites Alert (If present) */}
              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Institutional Prerequisites Required:</span> Completion of{' '}
                    {course.prerequisites.map((p, idx) => (
                      <strong key={idx} className="underline">
                        {p.prerequisiteCourse.title}
                        {idx < course.prerequisites!.length - 1 ? ', ' : ''}
                      </strong>
                    ))}{' '}
                    is recommended before mastering this advanced meteorological specialization.
                  </div>
                </div>
              )}

              {/* Mapped Competencies */}
              {course.courseCompetencies && course.courseCompetencies.length > 0 && (
                <Card className="p-5 border-slate-200 bg-white rounded-2xl shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    Target Competencies & WMO Mastery Levels
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.courseCompetencies.map((cc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900">{cc.competency.name}</div>
                          <div className="text-[11px] text-slate-500">Code: {cc.competency.code}</div>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                          Target Lvl {cc.targetLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Syllabus / Modules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Curriculum Syllabus ({course.modules?.length || 0} Modules • {totalLessonsCount} Lessons)
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)} Total Units
                  </span>
                </div>

                <div className="space-y-3">
                  {course.modules?.map((mod, mIdx) => {
                    const isExpanded = expandedModule === mod.id;
                    const moduleLessons = mod.lessons || [];
                    const moduleCompletedCount = moduleLessons.filter((l) => completedLessonIds.has(l.id)).length;
                    const isModuleComplete = moduleLessons.length > 0 && moduleCompletedCount === moduleLessons.length;

                    return (
                      <Card
                        key={mod.id}
                        className="border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                                Module {mIdx + 1}
                              </span>
                              {isModuleComplete && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Completed
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                            {mod.description && (
                              <p className="text-xs text-slate-500">{mod.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-slate-500 font-medium">
                              {moduleCompletedCount}/{moduleLessons.length} Done
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && moduleLessons.length > 0 && (
                          <div className="px-5 pb-5 pt-1 space-y-2 border-t border-slate-100 bg-slate-50/50">
                            {moduleLessons.map((lesson, lIdx) => {
                              const isLessonCompleted = completedLessonIds.has(lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    isLessonCompleted
                                      ? 'bg-emerald-50/40 border-emerald-200/80'
                                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 sm:mt-0 ${
                                        isLessonCompleted
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {isLessonCompleted ? '✓' : lIdx + 1}
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                          {lesson.title}
                                        </h4>
                                        {lesson.isPreview && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                            Preview
                                          </span>
                                        )}
                                      </div>
                                      {lesson.description && (
                                        <p className="text-[11px] text-slate-500 line-clamp-1">
                                          {lesson.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    <div className="flex items-center gap-2 text-[11px]">
                                      <span className="flex items-center gap-1 font-bold uppercase tracking-wider">
                                        {lesson.contentType === 'VIDEO' ? (
                                          <Video className="w-3.5 h-3.5 text-blue-600" />
                                        ) : lesson.contentType === 'DOCUMENT' ? (
                                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <FileCode className="w-3.5 h-3.5 text-amber-600" />
                                        )}
                                        <span className="text-slate-600">{lesson.contentType}</span>
                                      </span>
                                      <span>•</span>
                                      <span>{lesson.durationMinutes || 40}m</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        href={`/trainee/courses/${course.id}/learn/${lesson.id}`}
                                        title="Open Fullscreen LMS Player"
                                      >
                                        <button className="p-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                      </Link>
                                      <button
                                        onClick={() =>
                                          setActiveLesson({
                                            lesson,
                                            moduleTitle: mod.title,
                                            moduleIndex: mIdx,
                                            lessonIndex: lIdx,
                                          })
                                        }
                                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                                          isLessonCompleted
                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                                        }`}
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                        <span>{isLessonCompleted ? 'Review' : 'Study Lesson'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Immersive Interactive Curriculum Study Workspace & Player */}
          {activeLesson && (
            <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Player Top Navigation Bar */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      <span>{activeLesson.moduleTitle}</span>
                      <span>•</span>
                      <span>Lesson {activeLesson.lessonIndex + 1}</span>
                      {completedLessonIds.has(activeLesson.lesson.id) && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {activeLesson.lesson.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setActiveLesson(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Close Lesson Workspace"
                  >
                    ✕
                  </button>
                </div>

                {/* Sub-header Tabs */}
                <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto shrink-0">
                  <button
                    onClick={() => setActiveTab('CONTENT')}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'CONTENT'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Lesson Syllabus & Theory</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('SOP')}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'SOP'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Operational SOP Guidelines</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('COMPETENCIES')}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'COMPETENCIES'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Competency Rubric</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('RESOURCES')}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'RESOURCES'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Attached Resources</span>
                  </button>
                </div>

                {/* Main Scrollable Study Area */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
                  {/* TAB 1: CONTENT & THEORY */}
                  {activeTab === 'CONTENT' && (
                    <div className="space-y-6">
                      {/* Video Player Display if Video */}
                      {activeLesson.lesson.contentType === 'VIDEO' && (
                        <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg text-white">
                          <div className="aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 relative flex flex-col justify-between p-4 sm:p-6">
                            {/* Watermark & Badges */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-white font-mono font-bold">
                                MoES Training Telemetry • 1080p
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {activeLesson.lesson.durationMinutes || 45} mins stream
                              </span>
                            </div>

                            {/* Center Play Graphic */}
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 hover:scale-105 transition-all"
                              >
                                {isPlaying ? (
                                  <Pause className="w-7 h-7 fill-current" />
                                ) : (
                                  <Play className="w-7 h-7 fill-current ml-1" />
                                )}
                              </button>
                            </div>

                            {/* Controls Bar */}
                            <div className="space-y-2 pt-2">
                              {/* Scrubber */}
                              <div
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                                  setVideoProgress(Math.min(100, Math.max(0, pct)));
                                }}
                                className="w-full h-1.5 rounded-full bg-white/20 cursor-pointer overflow-hidden relative"
                              >
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${videoProgress}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-300">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="hover:text-white font-bold"
                                  >
                                    {isPlaying ? 'Pause' : 'Play'}
                                  </button>
                                  <span className="font-mono text-[11px] text-slate-400">
                                    {Math.round((videoProgress / 100) * (activeLesson.lesson.durationMinutes || 45))}:00 / {activeLesson.lesson.durationMinutes || 45}:00
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setPlaybackSpeed((prev) =>
                                        prev === '1x' ? '1.5x' : prev === '1.5x' ? '2x' : '1x'
                                      );
                                    }}
                                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold"
                                  >
                                    Speed: {playbackSpeed}
                                  </button>
                                  <Volume2 className="w-4 h-4 text-slate-400 cursor-pointer" />
                                  <Maximize className="w-4 h-4 text-slate-400 cursor-pointer" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lesson Content Body */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 leading-relaxed flex items-start gap-3">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">MoES Operational Curriculum Note:</span> This module
                            contains official guidance from the National Weather Forecasting Centre (NWFC) and WMO
                            No. 8 Standards. Review the core equations and meteorological diagnostic procedures below.
                          </div>
                        </div>

                        {/* Accurate Course Lesson Content */}
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                          <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                            {activeLesson.lesson.title} — Syllabus Overview
                          </h3>

                          {activeLesson.lesson.content ? (
                            <div className="prose prose-slate max-w-none text-xs sm:text-sm space-y-3">
                              <p className="font-medium text-slate-800 leading-relaxed">
                                {activeLesson.lesson.content}
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-600">
                              Comprehensive operational training syllabus for {activeLesson.lesson.title}. Covers
                              theoretical formulation, sensor telemetries, and operational decision trees.
                            </p>
                          )}

                          {/* Technical Principles & Physics */}
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <h4 className="font-bold text-slate-900">Key Scientific & Mathematical Formulations:</h4>
                            <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                              <div>∂p/∂z = -ρg (Hydrostatic Equilibrium Balance)</div>
                              <div>∂θ/∂z &gt; 0 (Dry Convective Stability Criterion)</div>
                              <div>VAD Velocity Formulation: V_r = u·cos(θ)·sin(φ) + v·cos(θ)·cos(φ) + w·sin(θ)</div>
                            </div>
                          </div>

                          {/* Core Observational Steps */}
                          <div className="space-y-2 pt-2">
                            <h4 className="font-bold text-slate-900">Operational Verification Checklist:</h4>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                              <li>Verify raw sensor voltage conversions against calibration certs.</li>
                              <li>Perform temporal continuity check with preceding 3-hour synoptic reports.</li>
                              <li>Check for non-meteorological ground clutter or sea breeze thermal boundaries.</li>
                              <li>Dispatch automated telemetry packet through IMD National Data Centre (NDC).</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: OPERATIONAL GUIDELINES */}
                  {activeTab === 'SOP' && (
                    <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          Official IMD Standard Operating Procedure (SOP-MET-2026)
                        </div>
                        <p className="text-xs text-amber-800">
                          Forecasters are required to execute standard quality control protocols before signing off on
                          nowcasting or synoptic advisories.
                        </p>
                      </div>

                      <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                        <h4 className="font-bold text-slate-900">Standard Calibration & Quality Tolerance Rubrics:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="font-bold text-indigo-700">Pressure Sensors:</span> Tolerance ±0.2 hPa
                            against digital barometer standard.
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="font-bold text-indigo-700">Doppler Reflectivity:</span> Absolute calibration
                            within ±1.0 dBZ against solar flux scans.
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="font-bold text-indigo-700">Temperature Loggers:</span> Daily dry bulb checks
                            within ±0.1°C of mercury psychrometer.
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="font-bold text-indigo-700">Warning Thresholds:</span> CAPE &gt; 1500 J/kg
                            triggers squall line advisory alert.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: COMPETENCY RUBRIC */}
                  {activeTab === 'COMPETENCIES' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-indigo-600" />
                          World Meteorological Organization (WMO) Competency Alignment
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          This lesson develops skills specified in the WMO BIP-M (Basic Instruction Package for
                          Meteorologists) and India Meteorological Department Competency Framework:
                        </p>

                        <div className="space-y-2 pt-2">
                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">Atmospheric Data Quality Control & Analysis</div>
                              <div className="text-[11px] text-slate-500">WMO Competency Benchmark: Level 2 / Level 3</div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                              Core Skill
                            </span>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">Synoptic & Mesoscale Feature Identification</div>
                              <div className="text-[11px] text-slate-500">WMO Competency Benchmark: Level 3 Advanced</div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                              Operational
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ATTACHED RESOURCES */}
                  {activeTab === 'RESOURCES' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Official Curriculum Downloads & Telemetry Datasets
                      </h4>

                      <div className="space-y-2">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-red-500" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                WMO_No_8_Observational_Standards_2026.pdf
                              </div>
                              <div className="text-[11px] text-slate-500">Official Standard Manual • 2.4 MB</div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs font-bold">
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <FileCode className="w-4 h-4 text-indigo-500" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                IMD_Sounding_Diagnostics_Tephigram.ipynb
                              </div>
                              <div className="text-[11px] text-slate-500">Jupyter Python Diagnostic Tool • 450 KB</div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs font-bold">
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Bottom Control & Progression Bar */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!prevLessonItem}
                      onClick={() => {
                        if (prevLessonItem) {
                          setActiveLesson(prevLessonItem);
                          setIsPlaying(false);
                        }
                      }}
                      className="text-xs font-bold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!nextLessonItem}
                      onClick={() => {
                        if (nextLessonItem) {
                          setActiveLesson(nextLessonItem);
                          setIsPlaying(false);
                        }
                      }}
                      className="text-xs font-bold flex items-center gap-1"
                    >
                      <span>Next Lesson</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleCompleteLesson}
                      disabled={updatingProgress}
                      className={`text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                        completedLessonIds.has(activeLesson.lesson.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {completedLessonIds.has(activeLesson.lesson.id)
                          ? 'Completed (Click to Re-verify)'
                          : updatingProgress
                          ? 'Saving Progress...'
                          : 'Mark Lesson as Completed'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
