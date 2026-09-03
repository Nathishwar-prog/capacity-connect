'use client';

import React from 'react';
import { BookOpen, CheckCircle2, TrendingUp, Award, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LearningOverviewGridProps {
  metrics: {
    enrolledCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    overallProgress: number;
  };
}

export const LearningOverviewGrid: React.FC<LearningOverviewGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Courses Enrolled */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Courses Enrolled
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.enrolledCourses}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            MoES & IMD capacity curricula
          </p>
        </div>
      </Card>

      {/* 2. In Progress */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            In Progress
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.inProgressCourses}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Active instructional modules
          </p>
        </div>
      </Card>

      {/* 3. Completed Pathways */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Completed Pathways
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.completedCourses}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Certified milestones achieved
          </p>
        </div>
      </Card>

      {/* 4. Overall Progress */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Overall Progress
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.overallProgress}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Average velocity across courses
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LearningOverviewGrid;
