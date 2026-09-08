'use client';

import React from 'react';
import { Users, BookOpenCheck, TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TrainerDashboardKPIs } from '@/features/trainer';

interface TrainerKpiGridProps {
  kpis: TrainerDashboardKPIs;
}

export const TrainerKpiGrid: React.FC<TrainerKpiGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Active Trainees */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Active Trainees
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.totalEnrollments}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="text-emerald-600 font-bold">{kpis.activeLearners} active</span> •{' '}
            {kpis.completedLearners} completed
          </p>
        </div>
      </Card>

      {/* 2. Active Courses */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Active Courses
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <BookOpenCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.publishedCourses}
            <span className="text-sm font-semibold text-slate-400 ml-1">/ {kpis.totalCourses}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="font-bold text-amber-600">{kpis.draftCourses} drafts</span> •{' '}
            {kpis.pendingCourses} in review
          </p>
        </div>
      </Card>

      {/* 3. Avg Completion */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Avg Completion
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.avgProgress}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Cohort progress across modules
          </p>
        </div>
      </Card>

      {/* 4. Avg Assessment */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Avg Assessment
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.avgScore}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Across {kpis.competenciesCovered} competencies evaluated
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TrainerKpiGrid;
