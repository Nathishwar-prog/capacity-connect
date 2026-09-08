'use client';

import React from 'react';
import useAuthStore from '@/store/auth';
import { useTraineeDashboard } from '../hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  TraineeDashboardHeader,
  ContinueLearningCard,
  LearningOverviewGrid,
  ActiveCoursesList,
  UpNextList,
  LearningJourneyCard,
  CompetencySnapshotCard,
  SkillGapPanel,
  AssessmentSnapshotCard,
  LearningResourcesList,
  RecommendedCoursesList,
  TrainerConnectionCard,
  AchievementsCard,
  RecentActivityTimeline,
  FuturePlaceholders,
} from './components';
import { RecommendationSection } from '@/components/recommendations';

export const TraineeDashboard: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const { data, isLoading, isError, refetch } = useTraineeDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* Continue Learning Hero Skeleton */}
        <Skeleton className="h-48 w-full rounded-3xl" />

        {/* Metrics Overview Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))}
        </div>

        {/* Courses & Up Next Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Unable to Load Your Learning Cockpit
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Could not retrieve your personalized curriculum progress from the MoES portal. Please check your connection and retry.
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

  const traineeName = data.user?.name || authUser?.firstName || 'Scientific Trainee';
  const departmentName = data.user?.department || 'Observational Meteorology';
  const designation = data.user?.designation || 'Scientific Officer';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Primary CTAs */}
      <TraineeDashboardHeader
        traineeName={traineeName}
        departmentName={departmentName}
        designation={designation}
      />

      {/* 2. Primary Hero Card: Continue Learning */}
      <ContinueLearningCard course={data.continueLearning} />

      {/* 3. Learning Progress Overview */}
      <LearningOverviewGrid metrics={data.metrics} />

      {/* 4. Active Courses (2 Cols) + Up Next (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveCoursesList courses={data.activeCourses} />
        </div>
        <div>
          <UpNextList items={data.upNext} />
        </div>
      </div>

      {/* 5. Learning Journey Milestone Progression */}
      <LearningJourneyCard />

      {/* 6. Competencies Snapshot (1 Col) + Skill Gaps (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompetencySnapshotCard competencies={data.competencies} />
        <SkillGapPanel gaps={data.skillGaps} />
      </div>

      {/* 7. Assessments (1 Col) + Learning Resources (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssessmentSnapshotCard assessments={data.assessments} />
        <LearningResourcesList resources={data.resources} />
      </div>

      {/* 8. Intelligent AI Recommendations & Outcome Tracking */}
      <RecommendationSection surface="DASHBOARD" limit={3} />

      {/* 9. Assigned Instructor (1 Col) + Achievements (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrainerConnectionCard trainer={data.trainer} />
        <AchievementsCard achievements={data.achievements} />
      </div>

      {/* 10. Recent Activity Timeline */}
      <RecentActivityTimeline activities={data.recentActivity} />

      {/* 11. Future AI Capabilities (Coming Soon) */}
      <FuturePlaceholders />
    </div>
  );
};

export default TraineeDashboard;
