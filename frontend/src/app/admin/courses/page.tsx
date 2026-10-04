'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  BookOpen,
  Search,
  RefreshCw,
  Users,
  Award,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Send,
  Eye,
  FileText,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AdminCoursesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Confirmation Modal states
  const [publishModalCourse, setPublishModalCourse] = useState<any | null>(null);
  const [unpublishModalCourse, setUnpublishModalCourse] = useState<any | null>(null);
  const [viewFeedbackCourse, setViewFeedbackCourse] = useState<any | null>(null);

  // 1. Fetch live Admin KPI Stats
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['adminCourseStats'],
    queryFn: async () => {
      const res = await apiClient.get('/courses/stats/admin');
      return res.data.data;
    },
    staleTime: 30 * 1000,
  });

  // 2. Fetch full course list for curriculum governance
  const {
    data: courses = [],
    isLoading: isCoursesLoading,
    refetch: refetchCourses,
    isRefetching,
  } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const res = await apiClient.get('/courses');
      return res.data.data || [];
    },
    staleTime: 30 * 1000,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchCourses();
  };

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await apiClient.post(`/courses/${courseId}/publish`);
      return res.data;
    },
    onSuccess: (data, courseId) => {
      showToast('Course successfully published to the Trainee Course Catalog!', 'success');
      setPublishModalCourse(null);
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourseStats'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to publish course.', 'error');
    },
  });

  // Unpublish Mutation
  const unpublishMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await apiClient.post(`/courses/${courseId}/unpublish`);
      return res.data;
    },
    onSuccess: (data, courseId) => {
      showToast('Course unpublished and removed from the active catalog.', 'info');
      setUnpublishModalCourse(null);
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourseStats'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to unpublish course.', 'error');
    },
  });

  // Filters
  const filteredCourses = courses.filter((c: any) => {
    const query = searchTerm.toLowerCase().trim();
    const instructorName = c.trainer ? `${c.trainer.firstName} ${c.trainer.lastName || ''}`.toLowerCase() : '';
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      (c.category && c.category.toLowerCase().includes(query)) ||
      instructorName.includes(query) ||
      c.id.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(
    new Set(courses.map((c: any) => c.category).filter(Boolean)),
  ) as string[];

  const stats = statsData || {
    totalCourses: courses.length,
    pendingReview: courses.filter((c: any) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW' || c.status === 'PENDING_APPROVAL').length,
    approved: courses.filter((c: any) => c.status === 'APPROVED').length,
    published: courses.filter((c: any) => c.status === 'PUBLISHED').length,
    rejected: courses.filter((c: any) => c.status === 'REJECTED').length,
    unpublished: courses.filter((c: any) => c.status === 'UNPUBLISHED').length,
    draft: courses.filter((c: any) => c.status === 'DRAFT').length,
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Curriculum Governance Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Courses & Quality Review
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect trainer-authored curricula, verify learning structures and assessments, and control publication to the national catalog.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isCoursesLoading || isRefetching}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-semibold"
                title="Refresh curriculum list"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Governance Live KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Courses
              </span>
              <div className="text-2xl font-black text-slate-900">{stats.totalCourses}</div>
              <span className="text-[10px] text-slate-500">In institutional registry</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Awaiting Review
              </span>
              <div className="text-2xl font-black text-amber-900">{stats.pendingReview}</div>
              <span className="text-[10px] text-amber-700 font-medium">Requires Admin action</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Approved
              </span>
              <div className="text-2xl font-black text-indigo-900">{stats.approved}</div>
              <span className="text-[10px] text-indigo-700 font-medium">Ready for publishing</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Published
              </span>
              <div className="text-2xl font-black text-emerald-900">{stats.published}</div>
              <span className="text-[10px] text-emerald-700 font-medium">Live in Trainee Catalog</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Rejected
              </span>
              <div className="text-2xl font-black text-rose-900">{stats.rejected}</div>
              <span className="text-[10px] text-rose-700 font-medium">Returned with feedback</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Draft / Unpub
              </span>
              <div className="text-2xl font-black text-slate-700">
                {(stats.draft || 0) + (stats.unpublished || 0)}
              </div>
              <span className="text-[10px] text-slate-500">Trainer authoring</span>
            </div>
          </div>

          {/* Toolbar & Filter Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search course title, domain, instructor..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Domains</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Statuses ({courses.length})</option>
                  <option value="SUBMITTED">Submitted ({courses.filter((c: any) => c.status === 'SUBMITTED').length})</option>
                  <option value="UNDER_REVIEW">Under Review ({courses.filter((c: any) => c.status === 'UNDER_REVIEW').length})</option>
                  <option value="APPROVED">Approved ({courses.filter((c: any) => c.status === 'APPROVED').length})</option>
                  <option value="PUBLISHED">Published ({courses.filter((c: any) => c.status === 'PUBLISHED').length})</option>
                  <option value="REJECTED">Rejected ({courses.filter((c: any) => c.status === 'REJECTED').length})</option>
                  <option value="UNPUBLISHED">Unpublished ({courses.filter((c: any) => c.status === 'UNPUBLISHED').length})</option>
                  <option value="DRAFT">Draft ({courses.filter((c: any) => c.status === 'DRAFT').length})</option>
                </select>
              </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs scrollbar-none">
              {[
                { label: 'All', value: 'ALL', count: courses.length },
                {
                  label: 'Pending Review',
                  value: 'SUBMITTED',
                  count: courses.filter((c: any) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length,
                  highlight: true,
                },
                { label: 'Approved', value: 'APPROVED', count: courses.filter((c: any) => c.status === 'APPROVED').length },
                { label: 'Published', value: 'PUBLISHED', count: courses.filter((c: any) => c.status === 'PUBLISHED').length },
                { label: 'Rejected', value: 'REJECTED', count: courses.filter((c: any) => c.status === 'REJECTED').length },
                { label: 'Draft', value: 'DRAFT', count: courses.filter((c: any) => c.status === 'DRAFT').length },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSelectedStatus(pill.value)}
                  className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] flex items-center gap-1.5 ${
                    selectedStatus === pill.value
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : pill.highlight && pill.count > 0
                      ? 'bg-amber-100/70 text-amber-800 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedStatus === pill.value ? 'bg-indigo-800 text-white' : 'bg-white/80 text-slate-700'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Courses Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Curriculum Title & Specs</th>
                    <th className="py-3.5 px-4">Domain Category</th>
                    <th className="py-3.5 px-4">Authoring Trainer</th>
                    <th className="py-3.5 px-4">Structure</th>
                    <th className="py-3.5 px-4">Enrolled</th>
                    <th className="py-3.5 px-4">Governance Status</th>
                    <th className="py-3.5 px-4 text-right">Review & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isCoursesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                          <span>Retrieving curriculum governance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                          <BookOpen className="w-8 h-8 text-slate-300" />
                          <span className="font-semibold text-slate-700">No courses match criteria</span>
                          <span className="text-[11px] text-slate-400">
                            Adjust your status or category filters, or wait for trainers to submit curricula for governance review.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course: any) => {
                      const isPending =
                        course.status === 'SUBMITTED' ||
                        course.status === 'UNDER_REVIEW' ||
                        course.status === 'PENDING_APPROVAL';
                      const isApproved = course.status === 'APPROVED';
                      const isPublished = course.status === 'PUBLISHED';
                      const isRejected = course.status === 'REJECTED';

                      const moduleCount = course._count?.modules ?? course.modules?.length ?? 0;
                      const lessonCount =
                        course._count?.lessons ??
                        course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) ??
                        0;
                      const assessmentCount =
                        course._count?.assessments ?? course.assessments?.length ?? 0;
                      const enrollmentCount = course._count?.enrollments ?? 0;

                      return (
                        <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <Link
                                href={`/admin/courses/${course.id}/review`}
                                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate max-w-xs sm:max-w-sm"
                              >
                                {course.title}
                              </Link>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>ID: {course.id.substring(0, 8)}</span>
                                <span>•</span>
                                <span className="uppercase text-slate-500 font-sans font-bold">
                                  {course.difficulty || 'INTERMEDIATE'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700">
                              {course.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-medium text-slate-900 block">
                                {course.trainer
                                  ? `${course.trainer.firstName} ${course.trainer.lastName || ''}`.trim()
                                  : 'Institutional Faculty'}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                {course.trainer?.email || ''}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-[11px] text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">{moduleCount}</span> Mods •{' '}
                              <span className="font-bold text-slate-800">{lessonCount}</span> Less •{' '}
                              <span className="font-bold text-slate-800">{assessmentCount}</span> Asmts
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{enrollmentCount}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <StatusBadge status={course.status} size="sm" />
                              {course.submittedAt && (
                                <div className="text-[10px] text-slate-400">
                                  Sub: {new Date(course.submittedAt).toLocaleDateString()}
                                </div>
                              )}
                              {course.publishedAt && (
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  Pub: {new Date(course.publishedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Main Review Link */}
                              <Link
                                href={`/admin/courses/${course.id}/review`}
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                  isPending
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <span>{isPending ? 'Review Course' : 'Inspect'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>

                              {/* Approved: Publish Button */}
                              {isApproved && (
                                <Button
                                  size="sm"
                                  onClick={() => setPublishModalCourse(course)}
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 gap-1 shadow-2xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Publish</span>
                                </Button>
                              )}

                              {/* Published: Unpublish Button */}
                              {isPublished && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUnpublishModalCourse(course)}
                                  className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-semibold px-2.5"
                                >
                                  <span>Unpublish</span>
                                </Button>
                              )}

                              {/* Rejected: View Feedback */}
                              {isRejected && course.rejectionReason && (
                                <button
                                  type="button"
                                  onClick={() => setViewFeedbackCourse(course)}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline px-1 cursor-pointer"
                                >
                                  Feedback
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CONFIRM PUBLISH MODAL
            ========================================================================= */}
        {publishModalCourse && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <Send className="w-4 h-4" />
                  <span>Publish Approved Course?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishModalCourse(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  You are about to publish{' '}
                  <strong className="text-slate-900 font-bold">
                    &quot;{publishModalCourse.title}&quot;
                  </strong>
                  .
                </p>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Catalog Activation Policy</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    This course will immediately become visible in the Trainee Course Catalog, eligible for learner self-enrollment, and included in AI skill-gap recommendations.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPublishModalCourse(null)}
                  disabled={publishMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate(publishModalCourse.id)}
                  disabled={publishMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {publishMutation.isPending ? 'Publishing...' : 'Confirm & Publish to Catalog'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CONFIRM UNPUBLISH MODAL
            ========================================================================= */}
        {unpublishModalCourse && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Unpublish Course?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUnpublishModalCourse(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  Are you sure you want to unpublish{' '}
                  <strong className="text-slate-900 font-bold">
                    &quot;{unpublishModalCourse.title}&quot;
                  </strong>
                  ?
                </p>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Catalog Removal Notice</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    The course will be immediately removed from the Trainee Catalog and cannot receive new enrollments. Historical learner progress and existing enrollments remain preserved.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnpublishModalCourse(null)}
                  disabled={unpublishMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => unpublishMutation.mutate(unpublishModalCourse.id)}
                  disabled={unpublishMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {unpublishMutation.isPending ? 'Unpublishing...' : 'Unpublish Course'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW REJECTION FEEDBACK MODAL
            ========================================================================= */}
        {viewFeedbackCourse && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Admin Rejection Feedback</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewFeedbackCourse(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Course</span>
                  <div className="font-bold text-slate-900 text-sm">{viewFeedbackCourse.title}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Authoring Trainer</span>
                  <div className="text-slate-700">
                    {viewFeedbackCourse.trainer
                      ? `${viewFeedbackCourse.trainer.firstName} ${viewFeedbackCourse.trainer.lastName || ''}`
                      : 'Faculty'}
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1.5">
                  <span className="font-bold text-[11px] block uppercase tracking-wider text-rose-800">
                    Feedback Provided to Trainer:
                  </span>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">
                    {viewFeedbackCourse.rejectionReason || 'No specific feedback reason recorded.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => setViewFeedbackCourse(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
