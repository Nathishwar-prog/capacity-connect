'use client';

import React from 'react';
import { useTraineeDashboardData } from '../hooks/useTraineeDashboardData';
import { WelcomeSection } from './WelcomeSection';
import { ProfileCompletionCard } from './ProfileCompletionCard';
import { ActiveCoursesCard } from './ActiveCoursesCard';
import { CourseProgressCard } from './CourseProgressCard';
import { UpcomingAssessmentsCard } from './UpcomingAssessmentsCard';
import { CompetencyCard } from './CompetencyCard';
import { SkillGapCard } from './SkillGapCard';
import { RecommendationCard } from './RecommendationCard';
import { AchievementsCard } from './AchievementsCard';
import { Skeleton } from '@/components/ui/skeleton';

export const TraineeDashboard: React.FC = () => {
  const { data, isLoading } = useTraineeDashboardData();

  if (isLoading || !data) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        {/* Top Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>

        {/* Second Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>

        {/* Third Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>

        {/* Fourth Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>

        {/* Bottom Section Skeleton */}
        <Skeleton className="h-60 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOP SECTION: Welcome Message (2 cols) + Profile Completion (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WelcomeSection
            traineeName={data.traineeName}
            designation={data.designation}
            department={data.department}
            organization={data.organization}
          />
        </div>
        <div>
          <ProfileCompletionCard profileCompletion={data.profileCompletion} />
        </div>
      </div>

      {/* 2. SECOND SECTION: Active Courses (1 col) + Overall Course Progress (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ActiveCoursesCard courses={data.activeCourses} />
        </div>
        <div>
          <CourseProgressCard
            overallPercentage={data.courseProgress.overallPercentage}
            courses={data.courseProgress.courses}
          />
        </div>
      </div>

      {/* 3. THIRD SECTION: Upcoming Assessments (1 col) + Competency (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <UpcomingAssessmentsCard assessments={data.upcomingAssessments} />
        </div>
        <div>
          <CompetencyCard competency={data.competency} />
        </div>
      </div>

      {/* 4. FOURTH SECTION: Skill Gaps (1 col) + Recommendations (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SkillGapCard skillGaps={data.skillGaps} />
        </div>
        <div>
          <RecommendationCard recommendations={data.recommendations} />
        </div>
      </div>

      {/* 5. BOTTOM SECTION: Achievements (Full width) */}
      <div>
        <AchievementsCard achievements={data.achievements} />
      </div>
    </div>
  );
};

export default TraineeDashboard;
