'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useCourseAnalytics } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  BarChart3,
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
  Clock,
  TrendingUp,
  BookOpen,
  Layers,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  Target,
  Sparkles,
  UserCheck,
  BrainCircuit,
  CheckCircle2,
} from 'lucide-react';

export default function CourseAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <CourseAnalyticsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function CourseAnalyticsContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data, isLoading, isError, error } = useCourseAnalytics(courseId);
  const [traineeSearch, setTraineeSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium text-slate-500">Loading course analytics and learning telemetry...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center space-y-4 rounded-3xl border border-rose-200 bg-rose-50/50">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unable to Load Course Analytics</h2>
        <p className="text-xs text-slate-600">
          {(error as any)?.response?.data?.message ||
            'You may not have permission to view analytics for this course, or the course does not exist.'}
        </p>
        <div className="pt-2">
          <Link href="/trainer/courses">
            <Button size="sm" variant="outline" className="text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to My Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { course, kpis, moduleBreakdown, competencies, priorityTopics, enrolledTrainees } = data;

  const filteredTrainees = enrolledTrainees.filter((t) => {
    const q = traineeSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Navigation & Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/trainer/courses" className="hover:text-slate-900 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> My Courses
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{course.title}</span>
          <span>/</span>
          <span className="text-indigo-600">Analytics</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {course.title}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  course.status === 'PUBLISHED'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : course.status === 'DRAFT'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {course.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Course Telemetry, Trainee Retention Funnels, and Adaptive Competency Health
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/trainer/courses/${courseId}/builder`}>
              <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 shadow-sm">
                <BookOpen className="w-3.5 h-3.5" /> Edit in Builder
              </Button>
            </Link>
            <Link href={`/trainer/courses/${courseId}/preview`}>
              <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 shadow-sm">
                <Layers className="w-3.5 h-3.5" /> Course Preview
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{kpis.totalEnrollments}</span>
              <span className="text-[11px] font-medium text-slate-500">learners</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="text-emerald-600 font-semibold">{kpis.activeLearners} active</span>
              <span>•</span>
              <span className="text-slate-600 font-semibold">{kpis.completedLearners} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{Math.round(kpis.completionRate)}%</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(kpis.completionRate))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Course Progress</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600">{Math.round(kpis.averageProgress)}%</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(kpis.averageProgress))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assessment Pass Rate</span>
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-violet-600">{Math.round(kpis.passRate)}%</span>
              <span className="text-[11px] font-medium text-slate-500">({kpis.totalAttempts} attempts)</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              Avg score: <span className="font-bold text-slate-700">{Math.round(kpis.averageScore)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics: Competency Attainment & Forgetting Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm p-5 flex items-center justify-between bg-gradient-to-r from-teal-50/40 to-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Target Competency Attainment
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated proficiency index achieved by learners across all tagged learning topics
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-teal-700">{Math.round(kpis.competencyAttainment)}%</div>
            <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">Proficient</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm p-5 flex items-center justify-between bg-gradient-to-r from-amber-50/40 to-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Adaptive Forgetting Risk
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cohort memory decay estimate computed from days since last review and spaced-repetition half-life
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black ${kpis.averageForgettingRisk > 50 ? 'text-rose-600' : 'text-amber-600'}`}>
              {Math.round(kpis.averageForgettingRisk)}%
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                kpis.averageForgettingRisk > 50 ? 'text-rose-600' : 'text-amber-600'
              }`}
            >
              {kpis.averageForgettingRisk > 50 ? 'High Decay' : 'Moderate Decay'}
            </span>
          </div>
        </Card>
      </div>

      {/* Curriculum Module Completion Breakdown & Priority Revision Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Funnel */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" /> Module Completion & Drop-off Funnel
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trainee progression through sequential curriculum modules
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {moduleBreakdown.length} Modules
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {moduleBreakdown.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No modules created for this course yet.
                </div>
              ) : (
                moduleBreakdown.map((m, idx) => {
                  const rate = Math.round(m.completionRate);
                  return (
                    <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-sm">{m.title}</span>
                          <span className="text-[10px] font-normal text-slate-400">({m.lessonCount} lessons)</span>
                        </div>
                        <span className="font-black text-slate-900">{rate}%</span>
                      </div>
                      <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Target Competencies */}
          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" /> Target Competencies Covered
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {competencies.length === 0 ? (
                <p className="text-xs text-slate-400">No specific competencies linked to this course.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {competencies.map((comp) => (
                    <div
                      key={comp.id}
                      className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/50 text-xs text-teal-900 flex items-center gap-2 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{comp.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-teal-700 border border-teal-200">
                        Target L{comp.targetLevel}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Priority Revision Topics from Spaced Repetition Engine */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-3xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Priority Retention Topics
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    High forgetting risk topics recommended for refresher drills
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {priorityTopics.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No critical retention risk topics identified for this course cohort yet.
                </div>
              ) : (
                priorityTopics.map((topic) => {
                  const isUrgent = topic.forgettingRisk > 60;
                  return (
                    <div
                      key={topic.topicId}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isUrgent
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-amber-200 bg-amber-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{topic.title}</div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            isUrgent
                              ? 'border-rose-300 bg-rose-100 text-rose-700'
                              : 'border-amber-300 bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isUrgent ? 'Urgent Revision' : 'Recommended'}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block font-medium">Competency Score</span>
                          <span className="font-bold text-slate-800">{Math.round(topic.competencyScore)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Forgetting Risk</span>
                          <span className={`font-bold ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`}>
                            {Math.round(topic.forgettingRisk)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enrolled Trainees Roster (Scoped to this Course) */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Enrolled Cohort Roster ({enrolledTrainees.length})
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Learners currently or previously enrolled in this course
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by name, email, department..."
                value={traineeSearch}
                onChange={(e) => setTraineeSearch(e.target.value)}
                className="pl-9 h-8 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTrainees.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              {enrolledTrainees.length === 0
                ? 'No trainees enrolled in this course yet.'
                : 'No trainees match your search criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Trainee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Enrolled On</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrainees.map((trainee) => (
                    <tr key={trainee.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{trainee.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{trainee.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {trainee.department || 'General IMD / MoES'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round(trainee.progress))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">
                            {Math.round(trainee.progress)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            trainee.status === 'COMPLETED'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : trainee.status === 'ACTIVE'
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {trainee.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(trainee.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link href={`/trainer/trainees/${trainee.traineeId}`}>
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold">
                            Trainee Profile <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
