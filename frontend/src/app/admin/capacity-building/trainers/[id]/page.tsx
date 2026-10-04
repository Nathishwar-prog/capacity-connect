'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Users,
  Star,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Building2,
  Mail,
  Calendar,
  Sparkles,
  ClipboardList,
  Library,
  Briefcase,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminTrainerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminTrainerDetail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/capacity-building/trainers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="p-16 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm font-bold text-slate-600">Loading trainer faculty portfolio & workload...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !data) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="p-16 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Trainer Not Found</h2>
            <p className="text-xs text-slate-500">The requested trainer faculty record could not be found.</p>
            <Link
              href="/admin/capacity-building/trainers"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Trainers Faculty</span>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const { profile, expertise, workloadMetrics, coursePortfolio, assignedLearners } = data;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/capacity-building/trainers"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
                title="Back to Faculty Roster"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Faculty Dossier & Instructional Performance</div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {profile.firstName} {profile.lastName || ''}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={profile.status} />
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Profile & Workload Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trainer Profile Card (1 Col) */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-700 font-extrabold text-xl flex items-center justify-center shrink-0 border border-purple-200">
                  {profile.firstName ? profile.firstName[0] : 'T'}
                </div>
                <div className="truncate">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {profile.firstName} {profile.lastName || ''}
                  </h2>
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="text-xs font-semibold text-purple-700 mt-1">
                    {profile.designation}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Department</span>
                  <span className="font-bold text-slate-800">{profile.department}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Domain Experience</span>
                  <span className="font-bold text-slate-800">{profile.yearsExperience} years</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Faculty Rating</span>
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{profile.averageRating} ({profile.totalReviews} reviews)</span>
                  </div>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className="font-bold text-emerald-700">
                    {profile.isAvailable ? 'Available for Mentorship' : 'Engaged in Fieldwork'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Joined Platform</span>
                  <span className="font-medium text-slate-600">
                    {new Date(profile.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {profile.bio && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Professional Biography
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {profile.bio}
                  </p>
                </div>
              )}

              {expertise && expertise.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Accredited Subject Expertise
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {expertise.map((exp: any, i: number) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 font-bold">
                        {exp.name} (Lvl {exp.proficiencyLevel})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Workload Stats & Portfolio (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Courses Authored
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {workloadMetrics.totalCourses}
                  </div>
                  <span className="text-[10px] text-slate-500">Curricula developed</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Trainees
                  </span>
                  <div className="text-2xl font-extrabold text-purple-700">
                    {workloadMetrics.totalLearners}
                  </div>
                  <span className="text-[10px] text-purple-600 font-semibold">Unique participants</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Completion Rate
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-700">
                    {workloadMetrics.completionRate}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {workloadMetrics.completedEnrollments} completed
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assessments Created
                  </span>
                  <div className="text-2xl font-extrabold text-indigo-700">
                    {workloadMetrics.assessmentsCreated}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {workloadMetrics.resourcesUploaded} resources
                  </span>
                </div>
              </div>

              {/* Course Portfolio Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Course Portfolio & Approval Velocity
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {coursePortfolio.length} courses total
                  </span>
                </div>

                {coursePortfolio.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    This trainer has not authored any courses yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {coursePortfolio.map((course: any) => (
                      <div key={course.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{course.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {course.category}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {course.modulesCount} modules • Created {new Date(course.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 sm:text-right">
                          <div>
                            <div className="font-bold text-slate-900">
                              {course.enrolledCount} Trainees
                            </div>
                            <div className="text-[11px] text-emerald-600 font-medium">
                              {course.completionRate}% completion
                            </div>
                          </div>

                          <StatusBadge status={course.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Trainees Roster */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Enrolled Trainees Across Faculty Courses
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {assignedLearners.length} active course participants
              </span>
            </div>

            {assignedLearners.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No trainees enrolled in this trainer&apos;s courses yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">Trainee</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Progress</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedLearners.slice(0, 15).map((ln: any) => (
                      <tr key={ln.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <Link
                            href={`/admin/capacity-building/trainees/${ln.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 block"
                          >
                            {ln.name}
                          </Link>
                          <span className="text-[10px] text-slate-400">{ln.email}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{ln.department}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{ln.courseTitle}</td>
                        <td className="py-2.5 px-3">
                          <div className="w-20 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-700">
                              {ln.progressPercentage}%
                            </span>
                            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-1 rounded-full"
                                style={{ width: `${Math.min(100, ln.progressPercentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                              ln.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {ln.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
