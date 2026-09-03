'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  useTrainerCourse,
  useSubmitCourseForApproval,
  useCreateModule,
  useDeleteModule,
  useCreateLesson,
  useDeleteLesson,
  useMapCompetency,
  useUnmapCompetency,
  LessonContentType,
} from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  Send,
  BookOpen,
  Layers,
  FileText,
  Video,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Eye,
} from 'lucide-react';

export default function CourseBuilderPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <CourseBuilderContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function CourseBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data: course, isLoading, refetch } = useTrainerCourse(courseId);
  const submitMutation = useSubmitCourseForApproval(courseId);
  const createModuleMutation = useCreateModule(courseId);
  const deleteModuleMutation = useDeleteModule(courseId);
  const createLessonMutation = useCreateLesson(courseId);
  const deleteLessonMutation = useDeleteLesson(courseId);
  const mapCompetencyMutation = useMapCompetency(courseId);
  const unmapCompetencyMutation = useUnmapCompetency(courseId);

  // Local state for modals / inline forms
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  const [activeModuleForLesson, setActiveModuleForLesson] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonType, setLessonType] = useState<LessonContentType>('ARTICLE');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonResourceUrl, setLessonResourceUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(20);
  const [lessonIsPreview, setLessonIsPreview] = useState(false);

  // Competency mapping modal/form
  const [showAddCompetency, setShowAddCompetency] = useState(false);
  const [competencyId, setCompetencyId] = useState('');
  const [targetLevel, setTargetLevel] = useState<number>(3);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Course Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested course does not exist or you do not have permission to view it.
        </p>
        <Link href="/trainer/courses">
          <Button size="sm" variant="outline" className="mt-4 text-xs">
            Return to Courses
          </Button>
        </Link>
      </div>
    );
  }

  const isEditable = course.status === 'DRAFT' || course.status === 'REJECTED';

  // Handler: Add Module
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    try {
      await createModuleMutation.mutateAsync({
        title: newModuleTitle,
        description: newModuleDesc || null,
        orderIndex: (course.modules.length || 0) + 1,
      });
      setNewModuleTitle('');
      setNewModuleDesc('');
      setShowAddModule(false);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create module');
    }
  };

  // Handler: Add Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleForLesson || !lessonTitle.trim()) return;

    try {
      await createLessonMutation.mutateAsync({
        moduleId: activeModuleForLesson,
        data: {
          title: lessonTitle,
          description: lessonDesc || null,
          contentType: lessonType,
          content: lessonContent || null,
          resourceUrl: lessonResourceUrl || null,
          durationMinutes: Number(lessonDuration),
          orderIndex: 1,
          isPreview: lessonIsPreview,
        },
      });
      setLessonTitle('');
      setLessonDesc('');
      setLessonContent('');
      setLessonResourceUrl('');
      setActiveModuleForLesson(null);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create lesson');
    }
  };

  // Handler: Submit for Approval
  const handleSubmitForApproval = async () => {
    const errors: string[] = [];

    if (course.modules.length === 0) {
      errors.push('Course must have at least one instructional module.');
    }

    course.modules.forEach((mod) => {
      if (mod.lessons.length === 0) {
        errors.push(`Module "${mod.title}" contains no lessons.`);
      }
    });

    if (course.courseCompetencies.length === 0) {
      errors.push('Course must map to at least one organizational competency framework.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    if (confirm('Submit this course for administrative review? It will enter PENDING_APPROVAL state.')) {
      try {
        await submitMutation.mutateAsync();
        setSuccessMessage('Course has been successfully submitted for institutional review.');
        refetch();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to submit course');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Course Portfolio</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                {course.difficulty}
              </Badge>
              <Badge
                variant={
                  course.status === 'PUBLISHED'
                    ? 'success'
                    : course.status === 'PENDING_APPROVAL'
                    ? 'warning'
                    : 'secondary'
                }
                className="text-[10px]"
              >
                {course.status}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">{course.category}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {course.title}
            </h1>

            <p className="text-xs text-slate-600 max-w-3xl line-clamp-2">
              {course.description}
            </p>
          </div>

          {/* Header Action: Submit */}
          {isEditable && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmitForApproval}
                disabled={submitMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                <span>Submit for Approval</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Validation / Success Messages */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Submission Validation Failed:</span>
          </div>
          <ul className="list-disc list-inside text-xs pl-2 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Two Column Layout: Left Modules/Lessons Tree, Right Competencies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules & Lessons Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Instructional Modules & Lessons ({course.modules.length})</span>
            </h2>

            {isEditable && (
              <Button
                size="sm"
                onClick={() => setShowAddModule(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>Add Module</span>
              </Button>
            )}
          </div>

          {/* Add Module Inline Modal */}
          {showAddModule && (
            <Card className="border-indigo-300 bg-indigo-50/40 animate-in fade-in duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-slate-900">Add New Module</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddModule} className="space-y-3">
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Module Title (e.g. Fundamental Atmospheric Dynamics)"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <textarea
                    value={newModuleDesc}
                    onChange={(e) => setNewModuleDesc(e.target.value)}
                    placeholder="Module Description / Objectives"
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddModule(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createModuleMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                    >
                      Create Module
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add Lesson Modal */}
          {activeModuleForLesson && (
            <Card className="border-indigo-300 bg-indigo-50/40 animate-in fade-in duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-slate-900">Add Lesson to Module</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLesson} className="space-y-3">
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Lesson Title (e.g. Geostrophic Wind Approximations)"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value as LessonContentType)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    >
                      <option value="ARTICLE">ARTICLE (Markdown / Text)</option>
                      <option value="VIDEO">VIDEO (Recorded Lecture / MP4)</option>
                      <option value="DOCUMENT">DOCUMENT (PDF / Scientific Manual)</option>
                      <option value="QUIZ">QUIZ (Interactive Assessment)</option>
                      <option value="LINK">LINK (External Portal / Dataset)</option>
                    </select>

                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      placeholder="Duration in mins"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  <input
                    type="url"
                    value={lessonResourceUrl}
                    onChange={(e) => setLessonResourceUrl(e.target.value)}
                    placeholder="Resource URL (e.g. https://... video or pdf link)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />

                  <textarea
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="Lesson text, article content, or instructions..."
                    rows={4}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={lessonIsPreview}
                        onChange={(e) => setLessonIsPreview(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Allow free preview</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveModuleForLesson(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={createLessonMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                      >
                        Save Lesson
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Modules List */}
          {course.modules.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No modules added yet</p>
              <p className="text-[11px] text-slate-500">
                Begin structuring this course by adding the first instructional module.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {course.modules.map((mod, modIdx) => (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                >
                  {/* Module Header */}
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                        {modIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-[11px] text-slate-500">{mod.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditable && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveModuleForLesson(mod.id)}
                            className="text-xs text-indigo-600 font-bold hover:bg-indigo-50"
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Add Lesson</span>
                          </Button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete module "${mod.title}" and its lessons?`)) {
                                await deleteModuleMutation.mutateAsync(mod.id);
                                refetch();
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lessons List under Module */}
                  <div className="p-3 space-y-2">
                    {mod.lessons.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic px-2 py-1">
                        No lessons in this module. Add at least one lesson.
                      </p>
                    ) : (
                      mod.lessons.map((lesson, lessonIdx) => (
                        <div
                          key={lesson.id}
                          className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono text-slate-400">
                              {modIdx + 1}.{lessonIdx + 1}
                            </span>
                            {lesson.contentType === 'VIDEO' ? (
                              <Video className="w-4 h-4 text-rose-500" />
                            ) : lesson.contentType === 'DOCUMENT' ? (
                              <FileText className="w-4 h-4 text-amber-500" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-indigo-500" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{lesson.title}</h4>
                                {lesson.isPreview && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Preview
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                <span className="uppercase font-semibold">{lesson.contentType}</span>
                                {lesson.durationMinutes && (
                                  <span>• {lesson.durationMinutes} mins</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isEditable && (
                            <button
                              onClick={async () => {
                                if (confirm(`Delete lesson "${lesson.title}"?`)) {
                                  await deleteLessonMutation.mutateAsync({
                                    moduleId: mod.id,
                                    lessonId: lesson.id,
                                  });
                                  refetch();
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competencies Mapping (1 Col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Mapped Competencies</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Official MoES / IMD competency frameworks developed by this course
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.courseCompetencies.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <strong>Action Required:</strong> Map at least one competency framework to allow institutional approval.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {course.courseCompetencies.map((cc) => (
                    <div
                      key={cc.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{cc.competency.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            {cc.competency.code}
                          </span>
                        </div>
                        {isEditable && (
                          <button
                            onClick={async () => {
                              await unmapCompetencyMutation.mutateAsync(cc.competencyId);
                              refetch();
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Target Level</span>
                        <Badge variant="outline" className="text-indigo-600 font-bold">
                          Level {cc.targetLevel} / 5
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
