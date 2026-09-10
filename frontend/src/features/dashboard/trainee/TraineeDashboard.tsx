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
  TodayLearningPlan,
  LearningJourneyCard,
  CompetencySnapshotCard,
  SkillGapPanel,
  AssessmentSnapshotCard,
  LearningResourcesList,
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
        <Skeleton className="h-56 w-full rounded-3xl" />

        {/* Metrics Overview Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))}
        </div>

        {/* Courses & Up Next Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
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

  // Urgent revision signal if skill gaps exist
  const urgentGap = data.skillGaps?.find((g) => g.priority === 'HIGH') || data.skillGaps?.[0];
  const urgentRevision = urgentGap
    ? {
        topicName: urgentGap.competencyName,
        reason: 'Competency gap identified below cadre operational benchmark',
        forgettingRisk: 'High',
      }
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ─────────────────────────────────────────────────────────────
          LEVEL 1: WHAT SHOULD I DO NOW? (Header + Next Action Hero)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <TraineeDashboardHeader
          traineeName={traineeName}
          departmentName={departmentName}
          designation={designation}
        />

        <ContinueLearningCard
          course={data.continueLearning}
          urgentRevision={urgentRevision}
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LEVEL 2: HOW AM I PROGRESSING? (Progress Summary + Active Work)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <LearningOverviewGrid metrics={data.metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Courses & Capacity Journey (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ActiveCoursesList courses={data.activeCourses} />
            <LearningJourneyCard />
          </div>

          {/* Up Next & Today's 20-min Plan (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <TodayLearningPlan
              activeCourseTitle={data.continueLearning?.courseTitle}
              activeCourseId={data.continueLearning?.courseId}
              urgentRevisionTopic={urgentGap?.competencyName}
            />
            <UpNextList items={data.upNext} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LEVEL 3: WHAT NEEDS IMPROVEMENT? (Competencies & Skill Gaps)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Priority 3 • Competency & Skill Health
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Diagnostic Gap Analysis</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompetencySnapshotCard competencies={data.competencies} />
          <SkillGapPanel gaps={data.skillGaps} />
        </div>

        <AssessmentSnapshotCard assessments={data.assessments} />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LEVEL 4: WHAT CAN HELP ME IMPROVE? (AI Recommendations & Resources)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Priority 4 • Recommendations & Learning Resources
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Institutional Curriculum</span>
        </div>

        <RecommendationSection surface="DASHBOARD" limit={3} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LearningResourcesList resources={data.resources} />
          <TrainerConnectionCard trainer={data.trainer} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LEVEL 5: WHAT HAVE I ACHIEVED? & RECENT ACTIVITY
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Priority 5 • Milestones & Learning History
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Verified Credentials</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AchievementsCard achievements={data.achievements} />
          <RecentActivityTimeline activities={data.recentActivity} />
        </div>

        <FuturePlaceholders />
      </section>
    </div>
  );
};

export default TraineeDashboard;
