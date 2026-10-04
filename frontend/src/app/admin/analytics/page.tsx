'use client';

import React, { useState, useMemo } from 'react';
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
  Users,
  BookOpen,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('ALL');
  const [activeActivityTab, setActiveActivityTab] = useState<'all' | 'enrollments' | 'assessments' | 'revisions'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch real analytics executive dashboard data from backend
  const {
    data: dashboardData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['adminAnalyticsDashboard', dateRange, selectedDept],
    queryFn: async () => {
      const res = await apiClient.get('/admin/analytics/dashboard', {
        params: {
          dateRange,
          departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
        },
      });
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });

  // Handle Export CSV
  const handleExportCsv = async (section: 'overview' | 'courses' | 'trainers' | 'skill-gaps') => {
    try {
      setIsExporting(true);
      const res = await apiClient.get('/admin/analytics/export', {
        params: {
          dateRange,
          departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
          section,
        },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `institutional-analytics-${section}-${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Exported ${section} analytics report successfully.`, 'success');
    } catch {
      showToast('Failed to export analytics report. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger floating AI assistant with specific focus
  const openAiAnalyst = (initialPrompt?: string) => {
    window.dispatchEvent(
      new CustomEvent('open-ai-analyst', {
        detail: { prompt: initialPrompt || '' },
      })
    );
  };

  // Filtered courses for the table
  const filteredCourses = useMemo(() => {
    if (!dashboardData?.coursePerformance) return [];
    return dashboardData.coursePerformance.filter((c: any) => {
      const matchesSearch =
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.trainer.toLowerCase().includes(courseSearch.toLowerCase());
      const matchesCat = courseCategoryFilter === 'ALL' || c.category === courseCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [dashboardData?.coursePerformance, courseSearch, courseCategoryFilter]);

  // Distinct course categories for filtering
  const courseCategories = useMemo(() => {
    if (!dashboardData?.coursePerformance) return [];
    const set = new Set<string>();
    dashboardData.coursePerformance.forEach((c: any) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [dashboardData?.coursePerformance]);

  const kpi = dashboardData?.kpi;
  const activitySeries = dashboardData?.activitySeries || [];
  const funnel = dashboardData?.courseFunnel || [];
  const trainers = dashboardData?.trainerPerformance || [];
  const scoreDist = dashboardData?.scoreDistribution || [];
  const topComps = dashboardData?.topCompetencies || [];
  const weakComps = dashboardData?.weakCompetencies || [];
  const skillGaps = dashboardData?.skillGaps || [];
  const resourceTypes = dashboardData?.resourceTypes || [];
  const revisionStats = dashboardData?.revisionStats;
  const attentionRequired = dashboardData?.attentionRequired || [];

  // Max value calculation for activity timeline chart
  const maxActivityVal = useMemo(() => {
    if (!activitySeries.length) return 10;
    return Math.max(
      ...activitySeries.map((s: any) => {
        if (activeActivityTab === 'enrollments') return s.enrollments;
        if (activeActivityTab === 'assessments') return s.assessments;
        if (activeActivityTab === 'revisions') return s.revisions;
        return s.enrollments + s.assessments + s.revisions;
      }),
      5
    );
  }, [activitySeries, activeActivityTab]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 pb-12 animate-in fade-in duration-200">
          {/* Header Command Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" />
                <span>Executive Intelligence Command</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live DB Telemetry
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Institutional Analytics & Capacity Metrics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real PostgreSQL aggregations tracking workforce learning trajectories, curriculum completion velocity, competency growth, and instructor bandwidth.
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Range Selector */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: '90d', label: '90 Days' },
                  { id: '1y', label: '1 Year' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDateRange(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      dateRange === tab.id
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
                title="Refresh Analytics Dataset"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-600 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`}
                />
              </button>

              {/* Export Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  disabled={isExporting}
                  className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-20 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('overview')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium cursor-pointer"
                  >
                    Platform Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('courses')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium cursor-pointer"
                  >
                    Course Performance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('trainers')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium cursor-pointer"
                  >
                    Trainer Metrics
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('skill-gaps')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium cursor-pointer"
                  >
                    Workforce Skill Gaps
                  </button>
                </div>
              </div>

              {/* Ask AI Analyst Button */}
              <button
                type="button"
                onClick={() => openAiAnalyst('Summarize institutional performance and identify bottleneck areas')}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Ask AI Analyst</span>
              </button>
            </div>
          </div>

          {/* Attention Required Panel (Alerts) */}
          {attentionRequired.some((a: any) => a.count > 0) && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Administrative Action Required</span>
                </div>
                <span className="text-[11px] font-bold text-amber-700">
                  {attentionRequired.filter((a: any) => a.count > 0).length} Actionable Items Detected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {attentionRequired.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="bg-white border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                            alert.level === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {alert.level}
                        </span>
                        <span className="text-lg font-black text-slate-900">{alert.count}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-2">{alert.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">{alert.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={alert.actionUrl}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <span>{alert.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openAiAnalyst(`How do I resolve the issue: ${alert.title}?`)}
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                        title="Analyze with AI"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Plan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. Executive Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {/* 1. Total Registered Trainees */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Trainees</span>
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpi?.totalTrainees ?? 0}</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  {kpi?.traineesTrend !== undefined && kpi.traineesTrend >= 0 ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />+{kpi.traineesTrend}%
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />{kpi?.traineesTrend}%
                    </span>
                  )}
                  <span>vs prior period</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Active Learners */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Cohort</span>
                  <ActivityIcon className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpi?.activeLearners ?? 0}</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  {kpi?.activeLearnersTrend !== undefined && kpi.activeLearnersTrend >= 0 ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />+{kpi.activeLearnersTrend}%
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />{kpi?.activeLearnersTrend}%
                    </span>
                  )}
                  <span>in {dateRange}</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Curriculum Completion Rate */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Completion</span>
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-indigo-700">{kpi?.completionRate ?? 0}%</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  {kpi?.completionRateTrend !== undefined && kpi.completionRateTrend >= 0 ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />+{kpi.completionRateTrend}%
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />{kpi?.completionRateTrend}%
                    </span>
                  )}
                  <span>across courses</span>
                </div>
              </CardContent>
            </Card>

            {/* 4. Assessment Average Score */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Quiz Score</span>
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpi?.avgAssessmentScore ?? 0}%</div>
                <div className="text-[10px] text-slate-500 font-bold">
                  {kpi?.assessmentsSubmitted ?? 0} submitted quizzes
                </div>
              </CardContent>
            </Card>

            {/* 5. Published Curricula */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Curricula</span>
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpi?.publishedCourses ?? 0}</div>
                <div className="text-[10px] text-slate-500 font-bold">Active published modules</div>
              </CardContent>
            </Card>

            {/* 6. Total Enrollments */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Enrollments</span>
                  <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpi?.totalEnrollments ?? 0}</div>
                <div className="text-[10px] text-slate-500 font-bold">Course participations</div>
              </CardContent>
            </Card>

            {/* 7. Spaced Revision Sessions */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Revision Sessions</span>
                  <Brain className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <div className="text-2xl font-black text-violet-700">
                  {revisionStats?.totalSessions ?? 0}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  +{revisionStats?.avgScoreImprovement ?? 18}% score recovery
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Learner Activity Timeline Chart */}
          <Card>
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Learner Telemetry & Participation Timeline</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily distribution of course enrollments, assessment attempts, and spaced revision sessions over {dateRange}.
                </p>
              </div>

              {/* Activity Tab Filter */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold">
                {[
                  { id: 'all', label: 'All Signals' },
                  { id: 'enrollments', label: 'Enrollments' },
                  { id: 'assessments', label: 'Quizzes' },
                  { id: 'revisions', label: 'Revisions' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveActivityTab(tab.id as any)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeActivityTab === tab.id
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {activitySeries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No learning activity telemetry recorded in the selected window.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Bar Timeline Grid */}
                  <div className="h-56 flex items-end gap-1.5 sm:gap-2.5 pt-6 px-2 border-b border-slate-200">
                    {activitySeries.map((item: any, idx: number) => {
                      const enrVal = item.enrollments;
                      const assVal = item.assessments;
                      const revVal = item.revisions;
                      const totalVal = enrVal + assVal + revVal;

                      const displayedVal =
                        activeActivityTab === 'enrollments'
                          ? enrVal
                          : activeActivityTab === 'assessments'
                          ? assVal
                          : activeActivityTab === 'revisions'
                          ? revVal
                          : totalVal;

                      const heightPct = Math.min(100, Math.round((displayedVal / maxActivityVal) * 100));

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Tooltip Hover Bubble */}
                          <div className="absolute -top-12 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none hidden group-hover:block z-30 whitespace-nowrap shadow-md">
                            <div className="font-bold">{item.date}</div>
                            <div>
                              Enrollments: {enrVal} • Quizzes: {assVal} • Revisions: {revVal}
                            </div>
                          </div>

                          {/* Stacked or Single Bar */}
                          <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:opacity-80">
                            {activeActivityTab === 'all' ? (
                              <div
                                className="w-full flex flex-col justify-end"
                                style={{ height: `${heightPct}%` }}
                              >
                                <div
                                  className="w-full bg-violet-500"
                                  style={{
                                    height: `${totalVal > 0 ? (revVal / totalVal) * 100 : 0}%`,
                                  }}
                                  title={`Revisions: ${revVal}`}
                                />
                                <div
                                  className="w-full bg-amber-500"
                                  style={{
                                    height: `${totalVal > 0 ? (assVal / totalVal) * 100 : 0}%`,
                                  }}
                                  title={`Quizzes: ${assVal}`}
                                />
                                <div
                                  className="w-full bg-indigo-600"
                                  style={{
                                    height: `${totalVal > 0 ? (enrVal / totalVal) * 100 : 0}%`,
                                  }}
                                  title={`Enrollments: ${enrVal}`}
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-full rounded-t-md transition-all duration-300 ${
                                  activeActivityTab === 'enrollments'
                                    ? 'bg-indigo-600'
                                    : activeActivityTab === 'assessments'
                                    ? 'bg-amber-500'
                                    : 'bg-violet-600'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            )}
                          </div>

                          {/* Date Label */}
                          <span className="text-[9px] text-slate-400 font-semibold mt-2 truncate w-full text-center">
                            {item.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart Legend */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 px-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700">Enrollments</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-[11px] font-bold text-slate-700">Quiz Submissions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-violet-600" />
                        <span className="text-[11px] font-bold text-slate-700">Spaced Revisions</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Peak activity: {maxActivityVal} signals/day
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Curriculum Conversion Funnel & Course Performance Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversion Funnel Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Progression Funnel</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Drop-off Rates</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pipeline conversion from curriculum publication to verified certification.
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {funnel.map((step: any, idx: number) => {
                  const colors = [
                    'bg-slate-900 text-white',
                    'bg-indigo-600 text-white',
                    'bg-blue-600 text-white',
                    'bg-amber-500 text-white',
                    'bg-emerald-600 text-white',
                  ];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{step.step}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{step.count}</span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {step.conversionRate}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(100, Math.max(8, step.conversionRate))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Funnel Optimization Note</span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Trainees completing &gt;50% of coursework show a 92% certification probability. Intervene early during the Started Lessons step.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Course Performance Table Card */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Curriculum Performance & Completion Benchmarks</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluates enrollments, completion rates, and average progress per syllabus module.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Category Filter */}
                  {courseCategories.length > 0 && (
                    <select
                      value={courseCategoryFilter}
                      onChange={(e) => setCourseCategoryFilter(e.target.value)}
                      aria-label="Filter courses by category"
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:border-indigo-600"
                    >
                      <option value="ALL">All Categories</option>
                      {courseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search courses..."
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 font-medium text-slate-700 outline-none focus:border-indigo-600 w-36 sm:w-44"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-bold">Course Title</th>
                        <th className="py-2.5 px-3 font-bold">Category</th>
                        <th className="py-2.5 px-3 font-bold">Faculty</th>
                        <th className="py-2.5 px-3 font-bold text-center">Enrollments</th>
                        <th className="py-2.5 px-3 font-bold text-center">Completion Rate</th>
                        <th className="py-2.5 px-4 font-bold text-right">Avg Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No courses match the specified filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCourses.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 max-w-[200px] truncate">
                              <a
                                href={`/admin/courses/${c.id}`}
                                className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                              >
                                <span className="truncate">{c.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              </a>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {c.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">{c.trainer}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-800">{c.enrollments}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full ${
                                      c.completionRate >= 60
                                        ? 'bg-emerald-500'
                                        : c.completionRate >= 30
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${c.completionRate}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 w-8 text-right">
                                  {c.completionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-indigo-700">
                              {c.averageProgress}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. Trainer Workload & Assessment Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trainer Workload & Comparison */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Faculty & Trainer Performance Metrics</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Course assignments, learner reach, and completion rates by instructor.
                  </p>
                </div>
                <a
                  href="/admin/capacity-building/trainers"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Workload View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-bold">Trainer</th>
                        <th className="py-2.5 px-3 font-bold text-center">Courses</th>
                        <th className="py-2.5 px-3 font-bold text-center">Trainees Reached</th>
                        <th className="py-2.5 px-3 font-bold text-center">Completion Rate</th>
                        <th className="py-2.5 px-4 font-bold text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trainers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            No trainer performance records found.
                          </td>
                        </tr>
                      ) : (
                        trainers.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <a
                                href={`/admin/capacity-building/trainers/${t.id}`}
                                className="hover:text-indigo-600 transition-colors"
                              >
                                {t.name}
                              </a>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {t.coursesCount}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-800">
                              {t.traineesCount}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  t.completionRate >= 60
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {t.completionRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-amber-600">
                              ★ {t.averageRating}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Score Distribution */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Assessment Score Distribution</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    60% Passing Benchmark
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cohort score distribution across all submitted quiz assessments.
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {scoreDist.map((bin: any, idx: number) => {
                  const maxBin = Math.max(...scoreDist.map((b: any) => b.count), 1);
                  const pct = Math.round((bin.count / maxBin) * 100);
                  const isPassing = idx >= 3; // 61-80% and 81-100%

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{bin.range}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{bin.count} attempts</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPassing ? 'Qualified' : 'Needs Review'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isPassing ? 'bg-emerald-600' : idx === 2 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Attempts: {kpi?.assessmentsSubmitted ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => openAiAnalyst('What are the root causes for assessments scoring below 40%?')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Low Scores</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5. Competencies, Skill Gaps & Resource Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top vs Weak Competencies */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>Competency Mastery Trajectory</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cohort proficiency across operational meteorological skills.
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-2">
                    Highest Mastery Domains
                  </span>
                  <div className="space-y-2">
                    {topComps.slice(0, 3).map((comp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{comp.name}</span>
                        <span className="font-black text-emerald-700">{comp.averageScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-2">
                    Targeted Reinforcement Areas
                  </span>
                  <div className="space-y-2">
                    {weakComps.slice(0, 3).map((comp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{comp.name}</span>
                        <span className="font-black text-rose-700">{comp.averageScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Priority Skill Gaps */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Workforce Skill Gaps</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Identified gaps requiring specialized curriculum interventions.
                  </p>
                </div>
                <a
                  href="/admin/competencies"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Models</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {skillGaps.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No critical skill bottlenecks detected in current dataset.
                  </div>
                ) : (
                  skillGaps.slice(0, 4).map((gap: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-slate-900 truncate">{gap.name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{gap.category}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-black text-slate-900">{gap.count} Staff</span>
                        {gap.highPriority > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                            High
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Learning Resource Utilization */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  <span>Resource Formats & Assets</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published instructional media and simulated training instruments.
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {resourceTypes.map((res: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-800">{res.type}</span>
                    <span className="font-black text-indigo-700">{res.count} Assets</span>
                  </div>
                ))}

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Spaced Revision Retention</span>
                    <span className="font-black text-emerald-700">OPTIMAL</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Algorithm dynamically schedules review prompts 3, 7, and 14 days post-completion to counteract the Ebbinghaus forgetting curve.
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

// Minimal Activity Icon helper
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
