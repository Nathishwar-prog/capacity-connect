'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useTrainerAnalytics } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function TrainerAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerAnalyticsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerAnalyticsContent() {
  const { data, isLoading } = useTrainerAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    activeLearners: 0,
    completedLearners: 0,
    avgProgress: 0,
    avgScore: 0,
    competenciesCovered: 0,
  };

  const courses = data?.coursePerformance || [];
  const competencies = data?.competenciesCovered || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Instructional Analytics & Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Performance metrics across atmospheric training curricula and trainee cohorts
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-l-4 border-l-indigo-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Curriculum Delivery
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {kpis.publishedCourses} / {kpis.totalCourses}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Published to catalog</span>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Trainee Cohort Size
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {kpis.totalEnrollments}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {kpis.completedLearners} completed • {kpis.activeLearners} active
          </span>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Cohort Progress Rate
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {kpis.avgProgress}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Average module completion</span>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Average Assessment Score
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {kpis.avgScore}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Across submitted evaluations</span>
        </Card>
      </div>

      {/* Course Performance Breakdown Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Course-Level Performance Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-xs text-slate-500">No courses available for performance analysis.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Enrolled</th>
                    <th className="py-3 px-4">Completion Rate</th>
                    <th className="py-3 px-4">Average Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {c.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={c.status === 'PUBLISHED' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {c.enrolledCount} learners
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600">{c.completionRate}%</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-28">
                          <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                            {c.averageProgress}%
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${c.averageProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competencies Covered */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Institutional Competency Frameworks Covered ({competencies.length})</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            Official operational competencies developed across your curriculum portfolio
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {competencies.map((comp) => (
              <div
                key={comp.id}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{comp.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
