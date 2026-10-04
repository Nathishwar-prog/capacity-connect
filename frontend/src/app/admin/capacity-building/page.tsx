'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Users,
  GraduationCap,
  Library,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Sparkles,
  ShieldAlert,
  FolderOpen,
  ChevronRight,
  Activity,
  FileText,
  Video,
  Presentation,
  Link2,
} from 'lucide-react';

export default function AdminCapacityBuildingOverviewPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminCapacityBuildingOverview'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/capacity-building/overview');
      return res.data.data;
    },
    staleTime: 30 * 1000,
  });

  const kpi = data?.kpi || {
    totalTrainees: 0,
    activeTrainees: 0,
    newTraineesThisMonth: 0,
    totalTrainers: 0,
    activeTrainers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    inProgressEnrollments: 0,
    notStartedEnrollments: 0,
    averageCompletionRate: 0,
    totalResources: 0,
    publishedResources: 0,
    pendingResources: 0,
  };

  const attentionRequired = data?.attentionRequired || [];
  const topCourses = data?.topCourses || [];
  const resourceTypeDistribution = data?.resourceTypeDistribution || [];
  const recentActivity = data?.recentActivity || [];

  const getResourceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-sky-500" />;
      case 'PRESENTATION':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'LINK':
        return <Link2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <FolderOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" />
                <span>Organizational Capacity Building</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Capacity Building Program Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Centralized governance of meteorological staff training, faculty instructional workload, curriculum completion, and learning assets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh Realtime</span>
              </button>
            </div>
          </div>

          {/* Quick Sub-Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/capacity-building/trainees"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Trainees Cohort
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {kpi.totalTrainees} enrolled learners, competency scores & activity
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>

            <Link
              href="/admin/capacity-building/trainers"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Faculty Instructors
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {kpi.totalTrainers} accredited trainers, workload & course portfolio
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>

            <Link
              href="/admin/capacity-building/learning-resources"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Learning Resources
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {kpi.totalResources} assets across syllabi, PDFs, and media
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>
          </div>

          {/* Primary Cross-Module KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Trainees
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {kpi.activeTrainees} Active
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoading ? '...' : kpi.totalTrainees.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-semibold text-emerald-600">+{kpi.newTraineesThisMonth}</span>
                <span>new registrations this month</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Accredited Trainers
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  {kpi.activeTrainers} Approved
                </span>
              </div>
              <div className="text-3xl font-extrabold text-purple-700 tracking-tight">
                {isLoading ? '...' : kpi.totalTrainers.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                Instructional faculty & subject experts
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Curricula
                </span>
                {kpi.pendingCourses > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    {kpi.pendingCourses} Pending Review
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold text-indigo-700 tracking-tight">
                {isLoading ? '...' : kpi.publishedCourses.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                Published courses out of {kpi.totalCourses} total
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Avg Syllabus Completion
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {kpi.completedEnrollments} Completed
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                {isLoading ? '...' : `${kpi.averageCompletionRate}%`}
              </div>
              <div className="text-xs text-slate-500">
                Across {kpi.totalEnrollments.toLocaleString()} total course enrollments
              </div>
            </div>
          </div>

          {/* Attention Required Panel (Action-Oriented Dashboard) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Attention Required & Administrative Actions
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Automated governance alerts & threshold triggers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {attentionRequired.map((alert: any) => {
                const isCritical = alert.level === 'CRITICAL';
                const isWarning = alert.level === 'WARNING';
                const cardBg = isCritical
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : isWarning
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${cardBg}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : isWarning ? (
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold leading-snug">
                          {alert.title}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={alert.actionUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline self-start text-indigo-700"
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Section: Top Courses & Enrollment Progress Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Courses (2 Cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Highest Enrollment Curricula
                  </h3>
                </div>
                <Link
                  href="/admin/courses"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>View All Curricula</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {topCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No courses published yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {topCourses.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 hover:text-indigo-600">
                            {c.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {c.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Instructor: <span className="font-semibold text-slate-700">{c.trainer}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 sm:text-right">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {c.enrolledCount} Trainees
                          </div>
                          <div className="text-[11px] text-emerald-600 font-medium">
                            {c.completedCount} Completed
                          </div>
                        </div>

                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Prog</span>
                            <span>{c.averageProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, c.averageProgress)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resource Assets & Cohort Distribution (1 Col) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Resource Asset Types
                  </h3>
                </div>
                <Link
                  href="/admin/capacity-building/learning-resources"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Manage
                </Link>
              </div>

              {resourceTypeDistribution.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No learning resources registered.
                </div>
              ) : (
                <div className="space-y-3">
                  {resourceTypeDistribution.map((item: any) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60"
                    >
                      <div className="flex items-center gap-2.5">
                        {getResourceTypeIcon(item.type)}
                        <span className="text-xs font-bold text-slate-800">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Cohort Enrollment Breakdown
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Completed</span>
                    <span className="font-bold text-emerald-700">{kpi.completedEnrollments}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">In Progress</span>
                    <span className="font-bold text-indigo-700">{kpi.inProgressEnrollments}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Not Started</span>
                    <span className="font-bold text-slate-500">{kpi.notStartedEnrollments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Governance & Learning Activity Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Recent Program Activity & Audit Events
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                10 most recent verified logs
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent activity logged in the database.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivity.map((act: any) => (
                  <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">
                          {act.user ? act.user.name : 'System Event'}
                        </span>{' '}
                        <span className="text-slate-600">performed</span>{' '}
                        <span className="font-semibold text-indigo-700">{act.action}</span>{' '}
                        <span className="text-slate-500">on {act.entityType}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
