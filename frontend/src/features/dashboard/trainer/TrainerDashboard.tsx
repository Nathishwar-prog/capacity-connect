'use client';

import React from 'react';
import {
  BookOpenCheck,
  Users,
  ClipboardList,
  MessageSquareQuote,
  PlusCircle,
  Star,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useTrainerDashboard } from '../hooks/useDashboard';
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

  const metrics = data?.metrics || {
    activeCourses: 0,
    totalTrainees: 0,
    pendingEvaluations: 0,
    feedbackCount: 0,
  };

  const courses = data?.courses || [];
  const recentFeedback = data?.recentFeedback || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Institutional Header */}
      <DashboardHeader
        userName={
          user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Instructor'
        }
        role="TRAINER"
        departmentName={user?.departmentName || 'Capacity Training & Research Wing'}
        portalSubtitle="Manage curriculum delivery, supervise trainee cohorts, and evaluate meteorological competency benchmarks."
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Published Courses"
          value={metrics.activeCourses}
          subtitle="Delivered instructional modules"
          icon={BookOpenCheck}
          variant="indigo"
        />
        <MetricCard
          title="Enrolled Trainees"
          value={metrics.totalTrainees}
          subtitle="Total trainees across courses"
          icon={Users}
          variant="emerald"
        />
        <MetricCard
          title="Pending Evaluations"
          value={metrics.pendingEvaluations}
          subtitle="Submitted trainee assessments"
          icon={ClipboardList}
          variant="amber"
        />
        <MetricCard
          title="Course Feedback"
          value={metrics.feedbackCount}
          subtitle="Ratings & review submissions"
          icon={MessageSquareQuote}
          variant="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Courses Instructed */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Courses Instructed</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Earth sciences & meteorological training modules under your instruction
                </p>
              </div>
              <Button size="sm" variant="default" className="text-xs font-bold">
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>New Course</span>
              </Button>
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
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{course.title}</h4>
                          <Badge variant="outline">{course.difficulty}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Slug: <span className="font-mono text-slate-600">{course.slug}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                          {course.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="text-xs">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Trainee Feedback & Cohorts */}
        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
                <span>Recent Trainee Feedback</span>
              </CardTitle>
              <p className="text-xs text-slate-500">Evaluation ratings from course participants</p>
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
