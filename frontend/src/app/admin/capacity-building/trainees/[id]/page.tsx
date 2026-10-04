'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Users,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Brain,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Building2,
  Mail,
  Phone,
  Shield,
  Target,
  Sparkles,
  Activity,
  ClipboardList,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminTraineeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminTraineeDetail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/capacity-building/trainees/${id}`);
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
            <p className="text-sm font-bold text-slate-600">Loading trainee learning profile & metrics...</p>
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
            <h2 className="text-lg font-bold text-slate-900">Trainee Not Found</h2>
            <p className="text-xs text-slate-500">The requested trainee record does not exist or has been removed.</p>
            <Link
              href="/admin/capacity-building/trainees"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Trainees Cohort</span>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const { profile, learningSummary, enrollments, competencyOverview, assessmentHistory, activityTimeline } = data;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back & Breadcrumb */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/capacity-building/trainees"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
                title="Back to Trainees"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Trainee Profile & Analytics</div>
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

          {/* Trainee Profile & Learning Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview Card (1 Col) */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-700 font-extrabold text-xl flex items-center justify-center shrink-0 border border-indigo-200">
                  {profile.firstName ? profile.firstName[0] : 'U'}
                </div>
                <div className="truncate">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {profile.firstName} {profile.lastName || ''}
                  </h2>
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mt-1">
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
                  <span className="text-slate-500">Target Role</span>
                  <span className="font-bold text-slate-800">{profile.targetRole}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Weekly Commitment</span>
                  <span className="font-bold text-slate-800">{profile.availableHoursPerWeek} hrs / wk</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Profile Completion</span>
                  <span className="font-extrabold text-emerald-700">{profile.profileCompletion}%</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Joined Platform</span>
                  <span className="font-medium text-slate-600">
                    {new Date(profile.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Last Login</span>
                  <span className="font-medium text-slate-600">
                    {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never logged in'}
                  </span>
                </div>
              </div>

              {profile.learningGoals && profile.learningGoals.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Learning Goals
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.learningGoals.map((g: string, i: number) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Learning Summary & Aggregate Progress (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Enrolled Curricula
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {learningSummary.totalEnrolled}
                  </div>
                  <span className="text-[10px] text-slate-500">Active enrollments</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Completed
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-700">
                    {learningSummary.completedCount}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Courses finished</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Average Progress
                  </span>
                  <div className="text-2xl font-extrabold text-indigo-700">
                    {learningSummary.averageProgress}%
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold">Across all syllabi</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assessments Done
                  </span>
                  <div className="text-2xl font-extrabold text-purple-700">
                    {learningSummary.assessmentsCompleted}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {learningSummary.assessmentsAttempted} attempted
                  </span>
                </div>
              </div>

              {/* Course Progress Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Curriculum Enrollments & Completion
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {enrollments.length} enrolled courses
                  </span>
                </div>

                {enrollments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    This trainee has not enrolled in any courses yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {enrollments.map((enr: any) => (
                      <div key={enr.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{enr.courseTitle}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {enr.category}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Instructor: <span className="font-semibold text-slate-700">{enr.trainerName}</span> • Enrolled{' '}
                            {new Date(enr.enrolledAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:text-right">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>Progress</span>
                              <span>{enr.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, enr.progressPercentage)}%` }}
                              />
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                              enr.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : enr.status === 'IN_PROGRESS'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {enr.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Competency & Skill Gap Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competency Topics Radar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Topic Competencies Evaluated
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {competencyOverview.topics.length} topics modeled
                </span>
              </div>

              {competencyOverview.topics.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No topic competency evaluations recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {competencyOverview.topics.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{t.topicName}</span>
                        <span className="font-extrabold text-indigo-700">{t.competencyScore}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, t.competencyScore)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Confidence: {(t.confidenceScore * 100).toFixed(0)}%</span>
                        <span>Attempts: {t.attemptCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Identified Skill Gaps */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Identified Competency Gaps
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {competencyOverview.skillGaps.length} gaps flagged
                </span>
              </div>

              {competencyOverview.skillGaps.length === 0 ? (
                <div className="p-8 text-center text-xs text-emerald-600 font-semibold">
                  ✓ No severe competency gaps flagged for this learner.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {competencyOverview.skillGaps.map((sg: any) => (
                    <div
                      key={sg.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{sg.skillName}</span>
                        <span className="text-[10px] text-slate-500">{sg.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            sg.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : sg.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sg.priority} PRIORITY
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {sg.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Recent Learning Activity & Interaction Timeline
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Evidence-based event sequence
              </span>
            </div>

            {activityTimeline.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No learning events recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {activityTimeline.map((evt: any) => (
                  <div key={evt.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span className="font-bold text-slate-900">{evt.eventType}</span>
                      <span className="text-slate-500">on {evt.topicName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({evt.source})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(evt.occurredAt).toLocaleString()}
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
