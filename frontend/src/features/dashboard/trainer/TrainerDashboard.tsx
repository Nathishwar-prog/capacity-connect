'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  Users,
  ClipboardList,
  MessageSquareQuote,
  PlusCircle,
  Star,
  ArrowRight,
  AlertTriangle,
  Award,
  TrendingUp,
  FileEdit,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useTrainerDashboard } from '@/features/trainer';
import { DashboardHeader } from '../components/DashboardHeader';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useTrainerDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const kpis = data?.kpis || {
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    pendingCourses: 0,
    totalEnrollments: 0,
    activeLearners: 0,
    completedLearners: 0,
    avgProgress: 0,
    avgScore: 0,
    competenciesCovered: 0,
  };

  const courses = data?.recentCourses || [];
  const trainees = data?.recentTrainees || [];
  const assessments = data?.assessments || [];
  const recentFeedback = data?.recentFeedback || [];
  const actionRequired = data?.actionRequired || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Institutional Header */}
      <DashboardHeader
        userName={
          user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Instructor'
        }
        role="TRAINER"
        departmentName={user?.departmentName || 'Meteorological Training Wing (IMD Pune)'}
        portalSubtitle="Manage earth science curricula, monitor trainee competency progression, and review assessment metrics."
      />

      {/* Action Required Banner */}
      {actionRequired.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Action Required</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              {actionRequired.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionRequired.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/80 shadow-xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{action.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{action.message}</p>
                </div>
                <Link href={action.link}>
                  <Button size="sm" variant="outline" className="text-xs font-semibold shrink-0 ml-3">
                    <span>Resolve</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Delivered Courses"
          value={`${kpis.publishedCourses} / ${kpis.totalCourses}`}
          subtitle={`${kpis.draftCourses} drafts, ${kpis.pendingCourses} in review`}
          icon={BookOpenCheck}
          variant="indigo"
        />
        <MetricCard
          title="Active Trainees"
          value={kpis.totalEnrollments}
          subtitle={`${kpis.activeLearners} learning, ${kpis.completedLearners} completed`}
          icon={Users}
          variant="emerald"
        />
        <MetricCard
          title="Avg Course Progress"
          value={`${kpis.avgProgress}%`}
          subtitle="Across all active enrollments"
          icon={TrendingUp}
          variant="amber"
        />
        <MetricCard
          title="Competencies Mapped"
          value={kpis.competenciesCovered}
          subtitle={`Avg test score: ${kpis.avgScore}%`}
          icon={Award}
          variant="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Courses & Trainees */}
        <div className="lg:col-span-2 space-y-8">
          {/* Courses Instructed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Courses Instructed</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Earth sciences & meteorological training modules under your instruction
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/trainer/courses">
                  <Button size="sm" variant="ghost" className="text-xs text-slate-600">
                    View All
                  </Button>
                </Link>
                <Link href="/trainer/courses/new">
                  <Button size="sm" variant="default" className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700">
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>New Course</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {courses.length === 0 ? (
                <EmptyState
                  icon={BookOpenCheck}
                  title="No Assigned Courses"
                  description="You have not created or been assigned any courses yet. Begin by drafting a training curriculum."
                  actionLabel="Create Course"
                  onAction={() => {}}
                />
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900">{course.title}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {course.difficulty}
                          </Badge>
                          <Badge
                            variant={course.status === 'PUBLISHED' ? 'success' : 'secondary'}
                            className="text-[10px]"
                          >
                            {course.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          <span>{course.moduleCount} modules</span>
                          <span>•</span>
                          <span>{course.enrolledCount} trainees</span>
                          <span>•</span>
                          <span>{course.completionRate}% completion</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/trainer/courses/${course.id}/builder`}>
                          <Button size="sm" variant="outline" className="text-xs font-semibold">
                            <FileEdit className="w-3 h-3 mr-1 text-slate-500" />
                            <span>Builder</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Trainees Recent Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Trainee Progress Overview</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent learning activity across your supervised cohorts
                </p>
              </div>
              <Link href="/trainer/trainees">
                <Button size="sm" variant="ghost" className="text-xs text-slate-600">
                  <span>All Trainees</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent>
              {trainees.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Enrolled Trainees"
                  description="Learners enrolled in your courses will appear here with live competency milestones."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {trainees.map((t) => (
                    <div
                      key={t.enrollmentId}
                      className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <Link
                          href={`/trainer/trainees/${t.traineeId}`}
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {t.name}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          {t.designation} • {t.department}
                        </p>
                        <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
                          {t.courseTitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] font-semibold mb-1">
                            <span className="text-slate-600">Progress</span>
                            <span className="text-slate-900">{t.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                t.progress >= 70
                                  ? 'bg-emerald-500'
                                  : t.progress >= 30
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                        </div>

                        <Link href={`/trainer/trainees/${t.traineeId}`}>
                          <Button size="sm" variant="ghost" className="text-xs text-indigo-600 font-semibold">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Assessments & Feedback */}
        <div className="space-y-8">
          {/* Assessments Overview */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <span>Assessments</span>
                </CardTitle>
                <p className="text-xs text-slate-500">Curriculum evaluations</p>
              </div>
              <Link href="/trainer/assessments">
                <Button size="sm" variant="ghost" className="text-xs">
                  All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No Assessments"
                  description="Create quizzes and practical evaluations to assess trainees."
                />
              ) : (
                <div className="space-y-3">
                  {assessments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">{a.title}</h5>
                        <Badge variant="outline" className="text-[10px]">
                          {a.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{a.courseTitle}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium pt-1">
                        <span>{a.questionsCount} questions</span>
                        <span>•</span>
                        <span>{a.attemptsCount} attempts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trainee Feedback */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
                  <span>Trainee Reviews</span>
                </CardTitle>
                <p className="text-xs text-slate-500">Recent participant feedback</p>
              </div>
              <Link href="/trainer/feedback">
                <Button size="sm" variant="ghost" className="text-xs">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <EmptyState
                  icon={MessageSquareQuote}
                  title="No Feedback Submitted"
                  description="Trainee ratings and commentary on course instruction will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{fb.traineeName}</span>
                        <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{fb.rating}/5</span>
                        </div>
                      </div>
                      {fb.courseTitle && (
                        <span className="text-[10px] text-indigo-700 font-semibold block">
                          {fb.courseTitle}
                        </span>
                      )}
                      {fb.comment && (
                        <p className="text-xs text-slate-600 italic">&ldquo;{fb.comment}&rdquo;</p>
                      )}
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
};

export default TrainerDashboard;
