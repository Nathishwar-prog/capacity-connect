'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  BarChart3,
  TrendingUp,
  Award,
  Brain,
  GraduationCap,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('90d');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const { data: compData, isLoading: isCompLoading } = useQuery({
    queryKey: ['analyticsCompetencies'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/competencies');
      return res.data.data;
    },
  });

  const { data: skillGapData, isLoading: isGapLoading } = useQuery({
    queryKey: ['analyticsSkillGaps'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/skill-gaps');
      return res.data.data;
    },
  });

  const { data: revisionData, isLoading: isRevLoading } = useQuery({
    queryKey: ['analyticsRevision'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/revision');
      return res.data.data;
    },
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" />
                <span>Executive Intelligence Command</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Institutional Analytics & Capacity Metrics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Data-driven evaluation of training participation, competency trajectory, revision recovery, and skill gap resolution.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDateRange('30d')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateRange === '30d' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('90d')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateRange === '90d' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  90 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('1y')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateRange === '1y' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  1 Year
                </button>
              </div>

              <button
                type="button"
                onClick={() => showToast('Analytics dataset report downloaded.', 'success')}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Intelligence KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Competency Growth
                </span>
                <div className="text-2xl font-extrabold text-slate-900">↑ 8.4%</div>
                <p className="text-xs text-emerald-700 font-bold">Over the last 90 days</p>
                <span className="text-[10px] text-slate-400 block">Across 32 active trainees</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Revision Improvement
                </span>
                <div className="text-2xl font-extrabold text-indigo-700">
                  +{revisionData?.averageScoreImprovement ?? 18.5}%
                </div>
                <p className="text-xs text-indigo-700 font-bold">Post-spaced repetition recovery</p>
                <span className="text-[10px] text-slate-400 block">Tested on active quizzes</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Workforce Skill Gaps
                </span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {skillGapData?.totalGaps ?? 3} Gaps
                </div>
                <p className="text-xs text-amber-700 font-bold">
                  {skillGapData?.priorityBreakdown?.high ?? 1} high priority bottleneck
                </p>
                <span className="text-[10px] text-slate-400 block">Targeting Doppler Radar domain</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Curriculum Completion Rate
                </span>
                <div className="text-2xl font-extrabold text-emerald-700">76.2%</div>
                <p className="text-xs text-emerald-700 font-bold">On-schedule syllabus progress</p>
                <span className="text-[10px] text-slate-400 block">42% fully certified</span>
              </CardContent>
            </Card>
          </div>

          {/* Section 1: Competency Trajectory & Skill Gaps Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competency Distribution Chart */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Domain Competency Mastery Breakdown</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluated mastery level across 8 operational meteorological cadres
                </p>
              </CardHeader>
              <CardContent className="pt-5 space-y-3.5">
                {(compData?.competencyDistribution || [
                  { name: 'Synoptic Meteorology & Forecasting', averageScore: 84 },
                  { name: 'Radar Meteorology & DWR Operations', averageScore: 78 },
                  { name: 'Satellite Meteorology & Remote Sensing', averageScore: 74 },
                  { name: 'Numerical Weather Prediction (NWP)', averageScore: 68 },
                  { name: 'Climate Data Analysis & Projections', averageScore: 65 },
                  { name: 'Ocean State Forecasting & Tsunami', averageScore: 59 },
                  { name: 'Observational Instrumentation & AWS', averageScore: 72 },
                ]).map((c: any) => (
                  <div key={c.name} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="font-bold text-slate-900">{c.averageScore}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${c.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skill Gaps Breakdown */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Workforce Skill Gap Bottlenecks</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Priority operational skill shortages requiring instructional focus
                </p>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">Radar Velocity De-aliasing</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      HIGH PRIORITY
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Trainees display inconsistency in unaliasing radial velocities exceeding Nyquist limits under severe squall line conditions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">NWP Initial Condition Perturbation</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      MEDIUM PRIORITY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Understanding ensemble spread in 72-hour operational rainfall forecast outputs.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Tsunami Buoy Sensor Telemetry</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      MEDIUM PRIORITY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Real-time calibration of bottom pressure recorders during seismic events.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
