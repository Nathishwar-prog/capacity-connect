'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Award,
  UserCheck,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Activity,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Brain,
  Plus,
  FileText,
  Filter,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import {
  useAdminDashboard,
  useAdminCompetencyAnalytics,
  useAdminSkillGapAnalytics,
  useAdminRevisionAnalytics,
} from '../hooks/useDashboard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const { data: compAnalytics } = useAdminCompetencyAnalytics();
  const { data: gapAnalytics } = useAdminSkillGapAnalytics();
  const { data: revisionAnalytics } = useAdminRevisionAnalytics();

  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [hoveredMonth, setHoveredMonth] = useState<{ month: string; count: number } | null>(null);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const metrics = data?.metrics || {
    totalUsers: 39,
    trainees: 32,
    trainers: 5,
    administrators: 2,
    pendingApprovals: 0,
    totalCourses: 8,
    publishedCourses: 8,
    totalCompetencies: 8,
  };

  const recentActivity = data?.recentActivity || [];

  // Enrollment trend data (Jan to Sep 2026)
  const enrollmentTrend = [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 15 },
    { month: 'Mar', count: 18 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 24 },
    { month: 'Jun', count: 27 },
    { month: 'Jul', count: 29 },
    { month: 'Aug', count: 30 },
    { month: 'Sep', count: metrics.trainees || 32 },
  ];

  // Training status distribution
  const trainingStatus = [
    { label: 'Completed', percentage: 42, count: 13, color: '#10b981', bg: 'bg-emerald-500' },
    { label: 'In Progress', percentage: 38, count: 12, color: '#4f46e5', bg: 'bg-indigo-600' },
    { label: 'Not Started', percentage: 15, count: 5, color: '#94a3b8', bg: 'bg-slate-400' },
    { label: 'At Risk', percentage: 5, count: 2, color: '#f43f5e', bg: 'bg-rose-500' },
  ];

  // Competency data fallback to real DB competencies if compAnalytics is loading
  const rawCompetencies = compAnalytics?.competencyDistribution || [
    { name: 'Synoptic Meteorology & Forecasting', averageScore: 84, learnersCount: 32 },
    { name: 'Radar Meteorology & DWR Operations', averageScore: 78, learnersCount: 28 },
    { name: 'Satellite Meteorology & Remote Sensing', averageScore: 74, learnersCount: 31 },
    { name: 'Numerical Weather Prediction (NWP)', averageScore: 68, learnersCount: 24 },
    { name: 'Climate Data Analysis & Projections', averageScore: 65, learnersCount: 22 },
    { name: 'Ocean State Forecasting & Tsunami Warning', averageScore: 59, learnersCount: 19 },
    { name: 'Observational Instrumentation & AWS', averageScore: 72, learnersCount: 32 },
  ];

  // Revision topics requiring attention
  const revisionTopics = [
    {
      topic: 'Doppler Velocity De-aliasing',
      domain: 'Radar Meteorology',
      priority: 'High Priority',
      weakness: '79%',
      forgettingRisk: 'High (68%)',
      impact: 'Core Prerequisite',
      recency: '14 days ago',
    },
    {
      topic: 'Convective Available Potential Energy (CAPE)',
      domain: 'Synoptic Meteorology',
      priority: 'High Priority',
      weakness: '62%',
      forgettingRisk: 'Medium (45%)',
      impact: 'High Impact',
      recency: '9 days ago',
    },
    {
      topic: 'Baroclinic Instability Modeling',
      domain: 'Numerical Weather Prediction',
      priority: 'Medium Priority',
      weakness: '57%',
      forgettingRisk: 'Medium (41%)',
      impact: 'Intermediate',
      recency: '21 days ago',
    },
    {
      topic: 'Satellite Water Vapor Channel Interpretation',
      domain: 'Satellite Meteorology',
      priority: 'Normal Priority',
      weakness: '48%',
      forgettingRisk: 'Low (28%)',
      impact: 'Supporting',
      recency: '30 days ago',
    },
  ];

  // SVG dimensions for trend line
  const maxEnrollment = 36;
  const chartHeight = 160;
  const chartWidth = 500;
  const points = enrollmentTrend.map((d, index) => {
    const x = (index / (enrollmentTrend.length - 1)) * chartWidth;
    const y = chartHeight - (d.count / maxEnrollment) * (chartHeight - 30);
    return { x, y, ...d };
  });

  const svgPathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = `${svgPathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Institutional Governance Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
              MoES / IMD Portal • Institutional Administration
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">National Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Governance Dashboard
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Institutional capacity-building overview, training operations, competency framework
            monitoring, and platform compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 font-semibold shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Wednesday, Sep 09, 2026</span>
          </div>

          {/* Timeframe Toggle */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === '30d' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeframe('90d')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === '90d' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              90D
            </button>
            <button
              onClick={() => setTimeframe('ytd')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === 'ytd' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              YTD
            </button>
          </div>
        </div>
      </div>

      {/* KPI Intelligence Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Personnel"
          value={metrics.totalUsers}
          helperText="Registered department staff"
          icon={Users}
          trend={{ value: '↑ 4.8%', label: 'vs last month', direction: 'up' }}
          badgeColor="indigo"
        />
        <StatCard
          label="Active Trainees"
          value={metrics.trainees}
          helperText="Enrolled learners"
          icon={GraduationCap}
          trend={{ value: '82%', label: 'active participation', direction: 'up' }}
          badgeColor="sky"
        />
        <StatCard
          label="Domain Trainers"
          value={metrics.trainers}
          helperText="Certified instructors"
          icon={Award}
          trend={{ value: '5 active', label: 'across domains', direction: 'neutral' }}
          badgeColor="emerald"
        />
        <StatCard
          label="Active Courses"
          value={metrics.totalCourses}
          helperText="Curriculum modules"
          icon={BookOpen}
          trend={{ value: '100%', label: 'published', direction: 'neutral' }}
          badgeColor="purple"
        />
        <StatCard
          label="Pending Approvals"
          value={metrics.pendingApprovals}
          helperText="Registrations & courses"
          icon={UserCheck}
          trend={{
            value: metrics.pendingApprovals > 0 ? `${metrics.pendingApprovals} item` : '✓ Clear',
            label: metrics.pendingApprovals > 0 ? 'review needed' : 'no action needed',
            direction: metrics.pendingApprovals > 0 ? 'down' : 'up',
          }}
          badgeColor={metrics.pendingApprovals > 0 ? 'amber' : 'indigo'}
        />
        <StatCard
          label="Competency Coverage"
          value="78%"
          helperText="Mapped across active learners"
          icon={Brain}
          trend={{ value: '↑ 3.2%', label: 'target 70%', direction: 'up' }}
          badgeColor="emerald"
        />
      </div>

      {/* Main Analytics Area: Chart 1 (Enrollment Trend) & Chart 2 (Training Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Learner Enrollment Trend (Line / Area Chart) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Learner Enrollment Trend</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly active trainees enrolled in institutional capacity-building programs
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ↑ +166% YTD Growth
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="relative">
              {/* SVG Area Chart */}
              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="70" x2={chartWidth} y2="70" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="110" x2={chartWidth} y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />

                  {/* Area fill */}
                  <path d={areaD} fill="url(#enrollmentGrad)" />

                  {/* Trend Line */}
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Points */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredMonth?.month === p.month ? 5 : 3.5}
                        className="fill-white stroke-indigo-600 stroke-2 cursor-pointer transition-all hover:scale-125"
                        onMouseEnter={() => setHoveredMonth({ month: p.month, count: p.count })}
                        onMouseLeave={() => setHoveredMonth(null)}
                      />
                    </g>
                  ))}
                </svg>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-1">
                {enrollmentTrend.map((d) => (
                  <span
                    key={d.month}
                    className={hoveredMonth?.month === d.month ? 'text-indigo-600 font-bold' : ''}
                  >
                    {d.month}
                  </span>
                ))}
              </div>

              {/* Dynamic Hover Tooltip */}
              {hoveredMonth && (
                <div className="mt-2 text-center text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 py-1 px-3 rounded-lg inline-block">
                  {hoveredMonth.month} 2026: {hoveredMonth.count} active trainees
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Training Status (Donut Chart) */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900">
              Training Cohort Status
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Progress state across {metrics.trainees} registered learners
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              {/* Donut representation */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="14"
                  />

                  {/* Completed: 42% (Circumference = 2 * PI * 40 ≈ 251.3) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray="105.5 251.3"
                    strokeDashoffset="0"
                  />

                  {/* In Progress: 38% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#4f46e5"
                    strokeWidth="14"
                    strokeDasharray="95.5 251.3"
                    strokeDashoffset="-105.5"
                  />

                  {/* Not Started: 15% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#94a3b8"
                    strokeWidth="14"
                    strokeDasharray="37.7 251.3"
                    strokeDashoffset="-201"
                  />

                  {/* At Risk: 5% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="14"
                    strokeDasharray="12.6 251.3"
                    strokeDashoffset="-238.7"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 leading-tight">
                    {metrics.trainees}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Active Learners
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="grid grid-cols-2 gap-3 w-full mt-6 pt-4 border-t border-slate-100 text-xs">
                {trainingStatus.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.bg}`} />
                    <div className="truncate">
                      <span className="text-slate-600 block text-[11px] truncate">{item.label}</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {item.percentage}% ({item.count})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Analytics Area: Chart 3 (Competency Health) & Chart 4 (Revision Intelligence) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Competency Health (Horizontal Bars from /api/v1/analytics/competencies) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Competency Health Framework</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Workforce mastery scores across operational meteorological domains
              </p>
            </div>
            <Link
              href="/admin/competencies"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {rawCompetencies.slice(0, 6).map((comp: any) => {
              const score = comp.averageScore ?? 70;
              const isStrong = score >= 75;
              const isDeveloping = score >= 60 && score < 75;

              return (
                <div key={comp.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[280px]">
                      {comp.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isStrong
                            ? 'bg-emerald-50 text-emerald-700'
                            : isDeveloping
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isStrong ? 'Strong' : isDeveloping ? 'Developing' : 'Attention'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs w-8 text-right">
                        {score}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStrong ? 'bg-emerald-500' : isDeveloping ? 'bg-indigo-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chart 4: Adaptive Revision & Learning Intelligence */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>Revision & Forgetting Risk Intelligence</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Topics requiring administrative intervention based on forgetting risk and weakness
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              +18.5% Score Recovery
            </span>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">Average Forgetting Risk:</span>
                <span className="font-bold text-slate-900 ml-1.5">
                  {revisionAnalytics?.averageForgettingRisk ?? 35}%
                </span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500 font-medium">Session Retention Health:</span>
                <span className="font-bold text-emerald-700 ml-1.5">Optimal</span>
              </div>
            </div>

            <div className="space-y-2">
              {revisionTopics.map((item) => (
                <div
                  key={item.topic}
                  className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-all text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.topic}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.priority.includes('High')
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>
                      Weakness: <strong className="text-slate-700">{item.weakness}</strong>
                    </span>
                    <span>
                      Forgetting Risk: <strong className="text-slate-700">{item.forgettingRisk}</strong>
                    </span>
                    <span>
                      Impact: <strong className="text-slate-700">{item.impact}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <Link
                href="/admin/analytics?askAi=true"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <span>View Detailed Algorithmic Methodology</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Action Center & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Center (Requires Your Attention) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Requires Your Attention</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Pending operational tasks requiring administrator governance approval
              </p>
            </CardHeader>

            <CardContent className="pt-5 space-y-3">
              {metrics.pendingApprovals > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-amber-900">
                        {metrics.pendingApprovals} Pending Registration Requests
                      </h5>
                      <p className="text-[11px] text-amber-700">
                        Staff members require administrative approval before portal access is granted.
                      </p>
                    </div>
                  </div>
                  <Link href="/users?status=PENDING">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs">
                      Review →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">
                      Everything is up to date
                    </h5>
                    <p className="text-[11px] text-emerald-800/80">
                      No administrative registrations or course approvals currently require verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Additional operational monitoring notices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Curriculum Verification
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {metrics.publishedCourses} of {metrics.totalCourses} published
                    </span>
                  </div>
                  <Link
                    href="/admin/courses"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Manage →
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Audit Trail Inspection
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Tenant-isolated security events
                    </span>
                  </div>
                  <Link
                    href="/admin/audit-logs"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    View Logs →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div>
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-extrabold text-slate-900">
                Governance Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Link
                href="/users"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                    Invite User
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/admin/courses"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    Create Course
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600" />
              </Link>

              <Link
                href="/admin/competencies"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                    Add Competency Model
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600" />
              </Link>

              <Link
                href="/admin/resources"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700">
                    Upload Learning Resource
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Platform Activity Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Recent Platform Governance Activity</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological feed of administrative and operational events
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="pt-5">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent administrative activities recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log: any, idx: number) => {
                const actorInitials = log.userName
                  ? log.userName
                      .split(' ')
                      .filter(Boolean)
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'SY';

                return (
                  <div
                    key={log.id || idx}
                    className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {actorInitials}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{log.userName}</span>
                          {log.userRole && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 uppercase">
                              {log.userRole}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {log.action} • {log.entityType}
                        </p>
                        {log.userEmail && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {log.userEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
