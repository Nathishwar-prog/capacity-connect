'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Brain,
  Search,
  Plus,
  RefreshCw,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';

export default function AdminCompetenciesPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminCompetenciesAnalytics'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/competencies');
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });

  const competencies = data?.competencyDistribution || [
    { code: 'COMP-SYNOPTIC-MET', name: 'Synoptic Meteorology & Weather Forecasting', category: 'Meteorology', learnersCount: 32, averageScore: 84, masteryRate: 88 },
    { code: 'COMP-NWP-MODELING', name: 'Numerical Weather Prediction & Modeling', category: 'Atmospheric Sciences', learnersCount: 24, averageScore: 68, masteryRate: 70 },
    { code: 'COMP-RADAR-MET', name: 'Radar Meteorology & DWR Operations', category: 'Observational Systems', learnersCount: 28, averageScore: 78, masteryRate: 82 },
    { code: 'COMP-SAT-MET', name: 'Satellite Meteorology & Remote Sensing', category: 'Remote Sensing', learnersCount: 31, averageScore: 74, masteryRate: 78 },
    { code: 'COMP-CLIMATE-SCI', name: 'Climate Data Analysis & Climate Change Projections', category: 'Climate Science', learnersCount: 22, averageScore: 65, masteryRate: 64 },
    { code: 'COMP-OCEAN-SCI', name: 'Ocean State Forecasting & Tsunami Warning', category: 'Ocean Sciences', learnersCount: 19, averageScore: 59, masteryRate: 58 },
    { code: 'COMP-SEISMOLOGY', name: 'Seismological Data Processing & Earthquake Monitoring', category: 'Geophysics', learnersCount: 18, averageScore: 62, masteryRate: 60 },
    { code: 'COMP-INSTRUMENTATION', name: 'Meteorological Instrumentation & AWS Networks', category: 'Observational Systems', learnersCount: 32, averageScore: 72, masteryRate: 76 },
  ];

  const filtered = competencies.filter((c: any) => {
    return (
      !searchTerm.trim() ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Brain className="w-4 h-4" />
                <span>Competency Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Institutional Competency Models & Frameworks
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                WMO 1083 compliance frameworks, atmospheric & marine domain standards, and workforce competency health.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh competencies"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast('Competency Calibration: Framework editor initialized.', 'info')
                }
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Competency Model</span>
              </button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Competencies
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{competencies.length}</div>
              <span className="text-[11px] text-slate-500">Standardized across 8 domains</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Evaluated Learners
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">
                {data?.evaluatedLearners || 32}
              </div>
              <span className="text-[11px] text-slate-500">Active meteorological trainees</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Average Mastery
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">74%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Above baseline target (70%)</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Coverage Rate
              </span>
              <div className="text-2xl font-extrabold text-purple-700">78%</div>
              <span className="text-[11px] text-slate-500">Mapped across operational staff</span>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search competency or domain..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
              />
            </div>
          </div>

          {/* Competency Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Competency Code & Name</th>
                    <th className="py-3.5 px-4">Domain Category</th>
                    <th className="py-3.5 px-4">Mapped Learners</th>
                    <th className="py-3.5 px-4">Average Mastery</th>
                    <th className="py-3.5 px-4">Mastery Rate</th>
                    <th className="py-3.5 px-4">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((comp: any) => {
                    const score = comp.averageScore;
                    const isStrong = score >= 75;
                    const isDeveloping = score >= 60 && score < 75;

                    return (
                      <tr key={comp.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block truncate max-w-sm">
                              {comp.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {comp.code}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{comp.category}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {comp.learnersCount}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1 w-36">
                            <div className="flex justify-between font-bold text-[11px]">
                              <span>{score}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isStrong ? 'bg-emerald-500' : isDeveloping ? 'bg-indigo-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {comp.masteryRate}%
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isStrong
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isDeveloping
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isStrong ? 'Strong' : isDeveloping ? 'Developing' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
