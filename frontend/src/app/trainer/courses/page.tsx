'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  useTrainerCourses,
  useDeleteCourse,
  usePublishCourse,
  useUnpublishCourse,
  useDuplicateCourse,
  trainerApi,
  CourseStatus,
  TrainerCourseListItem,
} from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpenCheck,
  PlusCircle,
  Search,
  FileEdit,
  Trash2,
  Users,
  Layers,
  Award,
  Loader2,
  Clock,
  Eye,
  BarChart3,
  Copy,
  Globe,
  Archive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  UploadCloud,
  FileText,
} from 'lucide-react';

export default function TrainerCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerCoursesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerCoursesContent() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Action modals state
  const [deleteModalCourse, setDeleteModalCourse] = useState<TrainerCourseListItem | null>(null);
  const [publishModalCourse, setPublishModalCourse] = useState<TrainerCourseListItem | null>(null);
  const [unpublishModalCourse, setUnpublishModalCourse] = useState<TrainerCourseListItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pre-flight validation state for publish modal
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    healthScore?: number;
  } | null>(null);

  const statusParam = selectedStatus === 'ALL' ? undefined : (selectedStatus as CourseStatus);

  const { data, isLoading, refetch } = useTrainerCourses({
    status: statusParam,
    search: searchQuery || undefined,
  });

  const deleteCourseMutation = useDeleteCourse();
  const publishCourseMutation = usePublishCourse();
  const unpublishCourseMutation = useUnpublishCourse();
  const duplicateCourseMutation = useDuplicateCourse();

  const courses = data?.courses || [];

  // Filter categories dynamically
  const categories = ['ALL', ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))];

  const filteredCourses = courses.filter((course) => {
    if (categoryFilter !== 'ALL' && course.category !== categoryFilter) return false;
    return true;
  });

  // Open Publish Modal & Run Pre-flight Check
  const openPublishModal = async (course: TrainerCourseListItem) => {
    setPublishModalCourse(course);
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await trainerApi.validateCourse(course.id);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        isValid: false,
        errors: [err?.response?.data?.message || 'Failed to complete pre-flight validation check.'],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Confirm Publish
  const handleConfirmPublish = async () => {
    if (!publishModalCourse) return;
    setIsActionLoading(true);
    try {
      await publishCourseMutation.mutateAsync(publishModalCourse.id);
      setActionFeedback({
        type: 'success',
        message: `"${publishModalCourse.title}" has been published and is now available in the trainee course catalog.`,
      });
      setPublishModalCourse(null);
      refetch();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to publish course.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Unpublish
  const handleConfirmUnpublish = async () => {
    if (!unpublishModalCourse) return;
    setIsActionLoading(true);
    try {
      await unpublishCourseMutation.mutateAsync(unpublishModalCourse.id);
      setActionFeedback({
        type: 'success',
        message: `"${unpublishModalCourse.title}" has been unpublished and reverted to DRAFT status for editing.`,
      });
      setUnpublishModalCourse(null);
      refetch();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to unpublish course.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Duplicate
  const handleDuplicate = async (course: TrainerCourseListItem) => {
    setIsActionLoading(true);
    try {
      await duplicateCourseMutation.mutateAsync(course.id);
      setActionFeedback({
        type: 'success',
        message: `Successfully cloned "${course.title}". The new draft is ready in your course list.`,
      });
      refetch();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to duplicate course.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Safe Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalCourse) return;
    setIsActionLoading(true);
    try {
      const res = await deleteCourseMutation.mutateAsync(deleteModalCourse.id);
      setActionFeedback({
        type: 'success',
        message: res?.message || `Course "${deleteModalCourse.title}" processed successfully.`,
      });
      setDeleteModalCourse(null);
      refetch();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to delete course.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'All Courses' },
    { key: 'PUBLISHED', label: 'Published' },
    { key: 'DRAFT', label: 'Drafts' },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { key: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                My Courses
              </h1>
              <p className="text-xs text-slate-500">
                Author, structure, preview, and publish atmospheric science training curricula
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/trainer/courses/import">
            <Button variant="outline" size="sm" className="text-xs font-semibold border-slate-300 hover:bg-slate-50">
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Import Document</span>
            </Button>
          </Link>
          <Link href="/trainer/courses/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold shadow-xs">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Create Course</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Feedback Toast / Alert */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs text-slate-500">Loading your courses...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Courses Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No training modules match the selected filter criteria. Create a new meteorological course to begin.
          </p>
          <Link href="/trainer/courses/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold mt-2">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Create Course</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCourses.map((course) => {
            const isDraft = course.status === 'DRAFT';
            const isPending = course.status === 'PENDING_APPROVAL';
            const isPublished = course.status === 'PUBLISHED';
            const isArchived = course.status === 'ARCHIVED';

            return (
              <Card
                key={course.id}
                className="hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between border-slate-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {course.difficulty}
                        </Badge>
                        <Badge
                          variant={
                            isPublished
                              ? 'success'
                              : isPending
                              ? 'warning'
                              : isDraft
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-[10px]"
                        >
                          {course.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {course.category}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                        {course.title}
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {course.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Meta stats */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold">{course.moduleCount}</span>
                      <span className="text-slate-400">mods</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold">{course.lessonCount}</span>
                      <span className="text-slate-400">lessons</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">{course.enrolledCount}</span>
                      <span className="text-slate-400">trainees</span>
                    </div>
                  </div>

                  {/* Competencies Badges */}
                  {course.competencies && course.competencies.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {course.competencies.slice(0, 3).map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700"
                        >
                          {comp}
                        </span>
                      ))}
                      {course.competencies.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          +{course.competencies.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress & Publishing Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <div>
                      {isPublished && course.publishedAt ? (
                        <span>Published: {new Date(course.publishedAt).toLocaleDateString()}</span>
                      ) : (
                        <span>Avg Completion: <strong className="text-slate-700 font-semibold">{course.completionRate}%</strong></span>
                      )}
                    </div>
                    <span className="font-mono text-[10px]">ID: {course.id.slice(0, 8)}...</span>
                  </div>

                  {/* State-Aware Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Course Builder (Allowed for DRAFT, PENDING_APPROVAL, PUBLISHED) */}
                      {!isArchived && (
                        <Link href={`/trainer/courses/${course.id}/builder`}>
                          <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold h-8">
                            <FileEdit className="w-3.5 h-3.5 mr-1" />
                            <span>Course Builder</span>
                          </Button>
                        </Link>
                      )}

                      {/* Course Preview (Always available for all states) */}
                      <Link href={`/trainer/courses/${course.id}/preview`}>
                        <Button size="sm" variant="outline" className="text-xs font-semibold h-8 text-slate-700 border-slate-300 hover:bg-slate-50">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          <span>Preview</span>
                        </Button>
                      </Link>

                      {/* Course Analytics (PUBLISHED only) */}
                      {isPublished && (
                        <Link href={`/trainer/courses/${course.id}/analytics`}>
                          <Button size="sm" variant="outline" className="text-xs font-semibold h-8 text-purple-700 border-purple-200 hover:bg-purple-50">
                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                            <span>Analytics</span>
                          </Button>
                        </Link>
                      )}

                      {/* Publish button (DRAFT only) */}
                      {isDraft && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPublishModal(course)}
                          className="text-xs font-semibold h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Globe className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Publish</span>
                        </Button>
                      )}

                      {/* Unpublish button (PUBLISHED only) */}
                      {isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnpublishModalCourse(course)}
                          className="text-xs font-semibold h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          <span>Unpublish</span>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Duplicate / Clone */}
                      <button
                        onClick={() => handleDuplicate(course)}
                        disabled={isActionLoading}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Duplicate / Clone Course"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Delete (DRAFT only) */}
                      {isDraft && (
                        <button
                          onClick={() => setDeleteModalCourse(course)}
                          disabled={isActionLoading}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Course Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 1. PRE-FLIGHT PUBLISH MODAL ────────────────────────────────────────── */}
      {publishModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Publish Course to Trainees</h3>
                  <p className="text-xs text-slate-500">Automated pre-flight readiness checklist</p>
                </div>
              </div>
              <button
                onClick={() => setPublishModalCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600">
                You are about to publish <strong className="text-slate-900 font-semibold">{publishModalCourse.title}</strong>.
                Published courses become visible in the trainee catalog and open for enrollment.
              </p>
            </div>

            {/* Validation Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Pre-Flight Validation
              </span>

              {isValidating ? (
                <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Checking curriculum completeness...</span>
                </div>
              ) : validationResult ? (
                <div className="space-y-2 text-xs">
                  {/* Title & Metadata Check */}
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Course title and metadata verified</span>
                  </div>

                  {/* Errors */}
                  {validationResult.errors.length > 0 ? (
                    validationResult.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-rose-700 font-medium">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700">Modules and lesson contents are valid</span>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.map((warn, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPublishModalCourse(null)}
                disabled={isActionLoading}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPublish}
                disabled={isActionLoading || isValidating || (validationResult !== null && !validationResult.isValid)}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    <span>Confirm & Publish</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. UNPUBLISH CONFIRMATION MODAL ────────────────────────────────────── */}
      {unpublishModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Unpublish Course?</h3>
                <p className="text-xs text-slate-500">Revert course to draft status</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Unpublishing <strong className="text-slate-900 font-semibold">{unpublishModalCourse.title}</strong> will remove it from the trainee catalog. Trainees currently enrolled will retain access, but no new enrollments will be permitted until republished.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnpublishModalCourse(null)}
                disabled={isActionLoading}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmUnpublish}
                disabled={isActionLoading}
                className="bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs"
              >
                {isActionLoading ? 'Unpublishing...' : 'Confirm Unpublish'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. DELETE / ARCHIVE PROTECTION MODAL ──────────────────────────────── */}
      {deleteModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Course?</h3>
                <p className="text-xs text-slate-500">Institutional deletion protection policy</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900">
                This action affects curriculum components:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
                <li>{deleteModalCourse.moduleCount} course modules and {deleteModalCourse.lessonCount} lessons</li>
                <li>Associated assessments and question banks</li>
                <li>Trainee enrollment assignments ({deleteModalCourse.enrolledCount} enrolled)</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              If active trainees or completed records exist, this course will be safely <strong>archived</strong> to preserve historical training records, certifications, and audit compliance.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalCourse(null)}
                disabled={isActionLoading}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isActionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs"
              >
                {isActionLoading ? 'Processing...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
