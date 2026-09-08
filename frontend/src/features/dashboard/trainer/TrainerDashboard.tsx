'use client';

import React from 'react';
import { useTrainerDashboard } from '@/features/trainer';
import useAuthStore from '@/store/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  TrainerDashboardHeader,
  TrainerKpiGrid,
  ActionRequiredPanel,
  LearningPerformanceChart,
  TraineeHealthCard,
  CoursePerformanceTable,
  TraineeAttentionList,
  CompetencySnapshotCard,
  AssessmentOverviewCard,
  RecentActivityCard,
  FeedbackSnapshotCard,
  AIInsightsPlaceholder,
  QuickActionsCard,
} from './components';

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: dashboard, isLoading, isError, refetch } = useTrainerDashboard();

  const trainerFullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Senior Scientist';

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))}
        </div>

        {/* Action Required Skeleton */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Performance & Health Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Unable to Load Training Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Could not retrieve aggregated metrics from the MoES learning portal. Please check your
            network connection and retry.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Primary CTAs */}
      <TrainerDashboardHeader
        trainerName={trainerFullName}
        departmentName="National Weather Forecasting Centre (NWFC)"
      />

      {/* 2. Hierarchical KPI Overview */}
      <TrainerKpiGrid kpis={dashboard.kpis} />

      {/* 3. Action Required Panel (Dynamic alerts) */}
      <ActionRequiredPanel items={dashboard.actionRequired || []} />

      {/* 4. Main Analytics: Learning Performance + Trainee Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LearningPerformanceChart trendData={dashboard.performanceTrend} />
        </div>
        <div>
          <TraineeHealthCard distribution={dashboard.traineeHealth} />
        </div>
      </div>

      {/* 5. Course Performance Table + Competency Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CoursePerformanceTable courses={dashboard.recentCourses} />
        </div>
        <div>
          <CompetencySnapshotCard snapshot={dashboard.competencySnapshot} />
        </div>
      </div>

      {/* 6. Trainees Needing Attention + Assessment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TraineeAttentionList trainees={dashboard.traineesNeedingAttention || []} />
        </div>
        <div>
          <AssessmentOverviewCard assessments={dashboard.assessments} />
        </div>
      </div>

      {/* 7. Recent Activity & Trainee Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard activities={dashboard.recentActivity} />
        <FeedbackSnapshotCard feedback={dashboard.recentFeedback} />
      </div>

      {/* 8. AI Training Insights (Future Ready Placeholder) */}
      <AIInsightsPlaceholder />

      {/* 9. Operational Quick Actions */}
      <QuickActionsCard />
    </div>
  );
};

export default TrainerDashboard;
