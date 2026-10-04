'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  HelpCircle,
  Award,
  Users,
  Send,
  XCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Video,
  List,
  Check,
  X,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AdminCourseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const courseId = params.id as string;

  // Tabs: 'CURRICULUM' | 'METADATA' | 'ASSESSMENTS' | 'VALIDATION'
  const [activeTab, setActiveTab] = useState<'CURRICULUM' | 'METADATA' | 'ASSESSMENTS' | 'VALIDATION'>('CURRICULUM');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);

  // Fetch full review package: Course tree + Completeness Validation Report
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminCourseReview', courseId],
    queryFn: async () => {
      // Mark as UNDER_REVIEW on first load if status is SUBMITTED
      const res = await apiClient.get(`/courses/${courseId}/review`);
      return res.data.data;
    },
    staleTime: 10 * 1000,
  });

  const course = data?.course;
  const validation = data?.validation || { isValid: false, errors: [], warnings: [], healthScore: 0 };

  // Toggle module expansion
  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Expand all by default once data loads
  React.useEffect(() => {
    if (course?.modules) {
      const initial: Record<string, boolean> = {};
      course.modules.forEach((m: any, idx: number) => {
        initial[m.id] = idx === 0; // expand first module by default
      });
      setExpandedModules(initial);

      if (course.modules[0]?.lessons?.[0]) {
        setSelectedLesson(course.modules[0].lessons[0]);
      }
    }
  }, [course?.id]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/courses/${courseId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      showToast('Course approved! It is now certified and eligible for publication.', 'success');
      setShowApproveModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourseStats'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Approval failed.', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiClient.post(`/courses/${courseId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      showToast('Course returned to Trainer with detailed feedback.', 'info');
      setShowRejectModal(false);
      setRejectionReason('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourseStats'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Rejection failed.', 'error');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/courses/${courseId}/publish`);
      return res.data;
    },
    onSuccess: () => {
      showToast('Course officially published to the Trainee Catalog!', 'success');
      setShowPublishModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourseStats'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Publishing failed.', 'error');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/courses/${courseId}/unpublish`);
      return res.data;
    },
    onSuccess: () => {
      showToast('Course unpublished and removed from catalog.', 'info');
      setShowUnpublishModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourseStats'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Unpublishing failed.', 'error');
    },
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-medium">
              Loading course syllabus, content structures, and assessment matrix...
            </span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !course) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Course Review Not Available</h2>
            <p className="text-xs text-slate-500">
              The requested curriculum record could not be loaded or is unavailable.
            </p>
            <Link href="/admin/courses">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Governance Catalog</span>
              </Button>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isPending =
    course.status === 'SUBMITTED' ||
    course.status === 'UNDER_REVIEW' ||
    course.status === 'PENDING_APPROVAL';
  const isApproved = course.status === 'APPROVED';
  const isPublished = course.status === 'PUBLISHED';
  const isRejected = course.status === 'REJECTED';

  const totalLessons =
    course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const totalAssessments = course.assessments?.length || 0;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 pb-24 animate-in fade-in duration-200">
          {/* Top Navigation & Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/courses"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                title="Back to Courses"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Curriculum Accreditation Review</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <span>{course.title}</span>
                  <StatusBadge status={course.status} size="sm" />
                </h1>
              </div>
            </div>

            {/* Quick Governance Audit Stamps */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {course.submittedAt && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-medium">
                  Submitted: {new Date(course.submittedAt).toLocaleDateString()}
                </span>
              )}
              {course.approvedAt && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                  Approved: {new Date(course.approvedAt).toLocaleDateString()}
                </span>
              )}
              {course.publishedAt && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-medium border border-indigo-200">
                  Published: {new Date(course.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Rejection Alert Banner (if rejected) */}
          {isRejected && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Curriculum Currently Rejected</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed pl-6">
                <strong>Feedback Given to Trainer:</strong> &quot;{course.rejectionReason || 'Content revision requested.'}&quot;
              </p>
              {course.rejectedAt && (
                <p className="text-[10px] text-rose-600 pl-6">
                  Rejected on {new Date(course.rejectedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Validation Health Scorecard */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black border ${
                  validation.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <span className="text-lg leading-none">{validation.healthScore}%</span>
                <span className="text-[9px] uppercase tracking-wider font-bold">Health</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {validation.isValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Curriculum Validation Passed — Ready for Approval</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Curriculum Validation Failed ({validation.errors?.length || 0} issues)</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {validation.isValid
                    ? 'All structural, module, lesson content, and assessment criteria met.'
                    : 'Critical elements are incomplete. Admin approval is locked until requirements are satisfied.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('VALIDATION')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                View Validation Checklist ({validation.errors?.length || 0})
              </button>
            </div>
          </div>

          {/* Review Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('CURRICULUM')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'CURRICULUM'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Syllabus & Lessons ({course.modules?.length || 0} Mods, {totalLessons} Less)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ASSESSMENTS')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ASSESSMENTS'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Assessments ({totalAssessments})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('METADATA')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'METADATA'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Metadata & Competencies</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('VALIDATION')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'VALIDATION'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Health Audit ({validation.healthScore}%)</span>
            </button>
          </div>

          {/* =========================================================================
              TAB 1: CURRICULUM INSPECTOR (Modules & Lessons)
              ========================================================================= */}
          {activeTab === 'CURRICULUM' && (
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Left Column: Module & Lesson Tree (5 cols) */}
              <div className="col-span-12 lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>MODULE & LESSON SYLLABUS</span>
                  <span>{course.modules?.length || 0} Modules Total</span>
                </div>

                <div className="space-y-3">
                  {(!course.modules || course.modules.length === 0) ? (
                    <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                      No modules found in this curriculum.
                    </div>
                  ) : (
                    course.modules.map((mod: any, mIdx: number) => {
                      const isExpanded = !!expandedModules[mod.id];
                      return (
                        <div
                          key={mod.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                        >
                          {/* Module Header */}
                          <button
                            type="button"
                            onClick={() => toggleModule(mod.id)}
                            className="w-full p-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                {mIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <h3 className="font-bold text-xs text-slate-900 truncate">
                                  {mod.title}
                                </h3>
                                <p className="text-[10px] text-slate-500">
                                  {mod.lessons?.length || 0} Lessons • {mod.description ? 'Has Overview' : 'No description'}
                                </p>
                              </div>
                            </div>
                            <div className="text-slate-400 p-1">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </button>

                          {/* Lessons List inside Module */}
                          {isExpanded && (
                            <div className="divide-y divide-slate-100 border-t border-slate-100">
                              {(!mod.lessons || mod.lessons.length === 0) ? (
                                <div className="p-3 text-[11px] text-amber-700 bg-amber-50/50 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Module has no lessons attached.</span>
                                </div>
                              ) : (
                                mod.lessons.map((les: any, lIdx: number) => {
                                  const isSelected = selectedLesson?.id === les.id;
                                  return (
                                    <button
                                      key={les.id}
                                      type="button"
                                      onClick={() => setSelectedLesson(les)}
                                      className={`w-full p-3 text-left flex items-center justify-between transition-colors cursor-pointer text-xs ${
                                        isSelected
                                          ? 'bg-indigo-50/70 text-indigo-900 font-bold border-l-4 border-indigo-600 pl-2.5'
                                          : 'hover:bg-slate-50 text-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[10px] font-mono text-slate-400 w-4">
                                          {lIdx + 1}.
                                        </span>
                                        <div className="min-w-0">
                                          <div className="font-semibold text-slate-900 truncate">
                                            {les.title}
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span className="uppercase">{les.contentType || 'ARTICLE'}</span>
                                            <span>•</span>
                                            <span>{les.durationMinutes || 15} mins</span>
                                            {les.isPreview && (
                                              <span className="text-emerald-600 font-bold">PREVIEW</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <Eye className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Selected Lesson Content Inspection (7 cols) */}
              <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs sticky top-20">
                {selectedLesson ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Lesson Inspection (Read-Only)</span>
                        </div>
                        <h2 className="text-lg font-black text-slate-900 mt-0.5">
                          {selectedLesson.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 uppercase text-[10px]">
                          {selectedLesson.contentType || 'ARTICLE'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 font-semibold text-indigo-700 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedLesson.durationMinutes || 15} mins
                        </span>
                      </div>
                    </div>

                    {/* Lesson Description */}
                    {selectedLesson.description && (
                      <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100">
                        <strong className="text-slate-900 block mb-1">Brief Overview:</strong>
                        <p>{selectedLesson.description}</p>
                      </div>
                    )}

                    {/* Learning Objectives */}
                    {selectedLesson.learningObjectives && selectedLesson.learningObjectives.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Lesson Learning Objectives
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                          {selectedLesson.learningObjectives.map((obj: string, i: number) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Substantive Content / Blocks Preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Full Educational Content
                      </span>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 space-y-3 leading-relaxed max-h-[350px] overflow-y-auto">
                        {(() => {
                          if (!selectedLesson.content) {
                            return (
                              <p className="text-slate-400 italic">
                                No educational content has been provided for this lesson.
                              </p>
                            );
                          }
                          // Attempt block parsing
                          try {
                            const parsed = JSON.parse(selectedLesson.content);
                            if (Array.isArray(parsed)) {
                              return parsed.map((block: any, bIdx: number) => (
                                <div key={block.id || bIdx} className="space-y-1">
                                  {block.type === 'heading' && (
                                    <h4 className="font-bold text-sm text-slate-900">{block.content}</h4>
                                  )}
                                  {block.type === 'paragraph' && (
                                    <p className="whitespace-pre-wrap">{block.content}</p>
                                  )}
                                  {block.type === 'callout' && (
                                    <div className="p-2.5 bg-indigo-50 border-l-3 border-indigo-600 rounded text-indigo-900">
                                      {block.content}
                                    </div>
                                  )}
                                  {block.type === 'code' && (
                                    <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto font-mono">
                                      {block.content}
                                    </pre>
                                  )}
                                </div>
                              ));
                            }
                          } catch {
                            // Fallback raw string
                          }
                          return (
                            <div className="whitespace-pre-wrap font-sans">
                              {selectedLesson.content}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Resources */}
                    {selectedLesson.lessonResources && selectedLesson.lessonResources.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Downloadable Resources & Files ({selectedLesson.lessonResources.length})
                        </span>
                        <div className="space-y-1">
                          {selectedLesson.lessonResources.map((res: any) => (
                            <div
                              key={res.id}
                              className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="font-semibold text-slate-800">
                                  {res.resource?.title || 'Resource Document'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase">
                                {res.resource?.fileType || 'PDF'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>Select any lesson from the left syllabus tree to inspect its complete content.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: ASSESSMENTS INSPECTION
              ========================================================================= */}
          {activeTab === 'ASSESSMENTS' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Curriculum Assessments & Quizzes ({course.assessments?.length || 0})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify passing criteria, multiple choice questions, correct answers, and explanations.
                  </p>
                </div>
              </div>

              {(!course.assessments || course.assessments.length === 0) ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold">No assessments configured for this course.</p>
                  <p className="text-[11px] text-slate-400">
                    Courses should include at least one diagnostic or summative assessment for competency evaluation.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {course.assessments.map((asm: any, aIdx: number) => (
                    <div
                      key={asm.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                              Assessment {aIdx + 1}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">{asm.title}</h3>
                          </div>
                          {asm.description && (
                            <p className="text-xs text-slate-500 mt-1">{asm.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                            Passing: {asm.passingScore || 70}%
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                            {asm.questions?.length || 0} Questions
                          </span>
                        </div>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-3">
                        {(!asm.questions || asm.questions.length === 0) ? (
                          <div className="p-3 text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                            Assessment has no questions configured.
                          </div>
                        ) : (
                          asm.questions.map((q: any, qIdx: number) => (
                            <div
                              key={q.id || qIdx}
                              className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-bold text-slate-900">
                                  <span className="text-indigo-600 mr-1.5">Q{qIdx + 1}.</span>
                                  <span>{q.text || q.question}</span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                  {q.points || 1} mark(s)
                                </span>
                              </div>

                              {/* Options */}
                              {q.options && q.options.length > 0 && (
                                <div className="space-y-1.5 pt-1 pl-4">
                                  {q.options.map((opt: any, oIdx: number) => {
                                    const isCorrect = opt.isCorrect || opt.id === q.correctOptionId;
                                    return (
                                      <div
                                        key={opt.id || oIdx}
                                        className={`p-2 rounded-lg border flex items-center justify-between ${
                                          isCorrect
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                            : 'bg-slate-50 border-slate-100 text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center border font-bold">
                                            {String.fromCharCode(65 + oIdx)}
                                          </span>
                                          <span>{opt.text}</span>
                                        </div>
                                        {isCorrect && (
                                          <span className="text-[10px] uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            <span>Correct Answer</span>
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {q.explanation && (
                                <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
                                  <strong>Explanation:</strong> {q.explanation}
                                </div>
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
          )}

          {/* =========================================================================
              TAB 3: METADATA & COMPETENCIES
              ========================================================================= */}
          {activeTab === 'METADATA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Metadata */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Curriculum Overview & Specs
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Description</span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Domain Category</span>
                      <div className="font-semibold text-slate-900">{course.category}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Target Difficulty</span>
                      <div className="font-semibold text-slate-900">{course.difficulty}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Estimated Duration</span>
                      <div className="font-semibold text-slate-900">
                        {Math.round(course.durationMinutes / 60)} Hours ({course.durationMinutes} mins)
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Language</span>
                      <div className="font-semibold text-slate-900">{course.language || 'English'}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Authoring Trainer</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {course.trainer
                        ? `${course.trainer.firstName} ${course.trainer.lastName || ''}`.trim()
                        : 'Faculty Member'}
                    </div>
                    <div className="text-slate-500 text-[11px]">{course.trainer?.email}</div>
                  </div>
                </div>
              </div>

              {/* Competencies & Prerequisites */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Competency Mapping & Prerequisites
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                      Mapped Organizational Competencies ({course.courseCompetencies?.length || 0})
                    </span>
                    {(!course.courseCompetencies || course.courseCompetencies.length === 0) ? (
                      <p className="text-amber-700 italic text-[11px]">
                        No competencies mapped to this curriculum.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {course.courseCompetencies.map((cc: any) => (
                          <div
                            key={cc.id}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900">
                                {cc.competency?.name || 'Competency'}
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">
                                Code: {cc.competency?.code || 'N/A'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                              Level {cc.targetLevel || 3}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                      Mandatory Course Prerequisites ({course.prerequisites?.length || 0})
                    </span>
                    {(!course.prerequisites || course.prerequisites.length === 0) ? (
                      <p className="text-slate-500 text-[11px]">No formal prerequisites specified.</p>
                    ) : (
                      <div className="space-y-1">
                        {course.prerequisites.map((p: any) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium"
                          >
                            {p.prerequisiteCourse?.title || p.title || 'Required Pre-Course'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: VALIDATION AUDIT CHECKLIST
              ========================================================================= */}
          {activeTab === 'VALIDATION' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Institutional Quality Checklist & Pre-Approval Audit
                  </h2>
                  <p className="text-xs text-slate-500">
                    Automated rule validation ensuring educational integrity before student catalog exposure.
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    validation.isValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Score: {validation.healthScore}%
                </div>
              </div>

              {/* Errors Block */}
              {validation.errors && validation.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Blocking Quality Failures ({validation.errors.length})</span>
                  </div>
                  <ul className="space-y-1 text-xs text-rose-900 list-disc pl-5">
                    {validation.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings Block */}
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Non-Blocking Quality Recommendations ({validation.warnings.length})</span>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-900 list-disc pl-5">
                    {validation.warnings.map((warn: string, i: number) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Checklist Items */}
              <div className="space-y-2.5">
                {[
                  {
                    label: 'Course title & domain category specified',
                    passed: Boolean(course.title && course.category),
                  },
                  {
                    label: 'Substantive course overview & description (>= 20 chars)',
                    passed: Boolean(course.description && course.description.length >= 20),
                  },
                  {
                    label: 'Authoring trainer associated with institutional credentials',
                    passed: Boolean(course.trainerId),
                  },
                  {
                    label: 'At least one learning module structured',
                    passed: Boolean(course.modules && course.modules.length > 0),
                  },
                  {
                    label: 'All modules populated with substantive lessons',
                    passed: Boolean(
                      course.modules &&
                        course.modules.length > 0 &&
                        course.modules.every((m: any) => m.lessons && m.lessons.length > 0),
                    ),
                  },
                  {
                    label: 'Lessons contain educational text or content blocks',
                    passed: Boolean(
                      course.modules &&
                        course.modules.every((m: any) =>
                          (m.lessons || []).every((l: any) => Boolean(l.content && l.content.length > 0)),
                        ),
                    ),
                  },
                  {
                    label: 'Competency frameworks aligned for skill-gap tracking',
                    passed: Boolean(course.courseCompetencies && course.courseCompetencies.length > 0),
                  },
                  {
                    label: 'Assessments configure valid questions and correct answer keys',
                    passed: Boolean(
                      !course.assessments ||
                        course.assessments.length === 0 ||
                        course.assessments.every((a: any) =>
                          (a.questions || []).every((q: any) =>
                            q.options && q.options.some((o: any) => o.isCorrect),
                          ),
                        ),
                    ),
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      item.passed
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.passed ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.passed ? 'Verified' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              FIXED BOTTOM GOVERNANCE ACTION BAR
              ========================================================================= */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-lg">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={course.status} size="md" />
                <span className="text-xs text-slate-600 hidden md:inline">
                  {isPending && 'Course awaiting administrative quality decision.'}
                  {isApproved && 'Course certified by Admin. Ready to be published to trainees.'}
                  {isPublished && 'Course is live in Trainee Catalog.'}
                  {isRejected && 'Course rejected. Waiting for trainer revision and resubmission.'}
                  {course.status === 'DRAFT' && 'Trainer is actively authoring draft.'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Pending Review Actions: Reject or Approve */}
                {isPending && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectModal(true)}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Course</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowApproveModal(true)}
                      disabled={!validation.isValid}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm disabled:opacity-50"
                      title={!validation.isValid ? 'Fix validation errors before approving' : 'Approve curriculum'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Course</span>
                    </Button>
                  </>
                )}

                {/* Approved Actions: Publish */}
                {isApproved && (
                  <Button
                    size="sm"
                    onClick={() => setShowPublishModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Course to Catalog</span>
                  </Button>
                )}

                {/* Published Actions: Unpublish */}
                {isPublished && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnpublishModal(true)}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Unpublish from Catalog</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            APPROVE CONFIRMATION MODAL
            ========================================================================= */}
        {showApproveModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Course?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  You are certifying that <strong className="text-slate-900 font-bold">&quot;{course.title}&quot;</strong> meets all institutional curriculum quality standards.
                </p>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 space-y-1">
                  <div className="font-bold">Next Steps After Approval:</div>
                  <p className="text-[11px] text-indigo-800">
                    The course will transition to <strong>APPROVED</strong> status. It will <em>not</em> immediately appear in the Trainee Course Catalog until an explicit <strong>Publish</strong> step is performed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApproveModal(false)}
                  disabled={approveMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REJECT REASON MODAL
            ========================================================================= */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>Reject Curriculum & Request Revisions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  Please provide clear, actionable feedback explaining why{' '}
                  <strong className="text-slate-900 font-bold">&quot;{course.title}&quot;</strong> is being rejected. This feedback will be delivered directly to the authoring trainer.
                </p>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-xs block">
                    Rejection Feedback / Required Fixes <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Please add substantive lecture content and code examples to Module 2, and ensure all questions in Assessment 1 have designated correct answers."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                  disabled={rejectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => rejectMutation.mutate(rejectionReason.trim())}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Course & Notify Trainer'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PUBLISH MODAL
            ========================================================================= */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <Send className="w-4 h-4" />
                  <span>Publish Approved Course?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  Publishing{' '}
                  <strong className="text-slate-900 font-bold">&quot;{course.title}&quot;</strong> will make it active across the nation.
                </p>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Trainee Accessibility Activation</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    The course will immediately appear in the Trainee Course Catalog, participate in AI skill gap recommendations, and allow verified trainees to enroll.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPublishModal(false)}
                  disabled={publishMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {publishMutation.isPending ? 'Publishing...' : 'Publish to Catalog'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            UNPUBLISH MODAL
            ========================================================================= */}
        {showUnpublishModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Unpublish Course?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnpublishModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  Are you sure you want to unpublish{' '}
                  <strong className="text-slate-900 font-bold">&quot;{course.title}&quot;</strong>?
                </p>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Catalog Removal Notice</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    The course will be immediately removed from trainee view. Existing enrolled learners keep their progress and completion history.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnpublishModal(false)}
                  disabled={unpublishMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => unpublishMutation.mutate()}
                  disabled={unpublishMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {unpublishMutation.isPending ? 'Unpublishing...' : 'Unpublish Course'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
