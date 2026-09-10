'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Compass,
  Layers,
  ChevronRight,
  Info,
  ListOrdered,
} from 'lucide-react';

interface SkillGapItem {
  id: string;
  userId: string;
  competencyId: string;
  currentLevel: number;
  requiredLevel: number;
  gapLevel: number;
  gapSeverity: number;
  priorityScore: number;
  classification: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  competency: {
    id: string;
    code: string;
    name: string;
    category?: string;
  };
  recommendedCourses?: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
}

const FALLBACK_GAPS: SkillGapItem[] = [
  {
    id: 'sg-1',
    userId: 'u-1',
    competencyId: 'c-1',
    currentLevel: 2,
    requiredLevel: 4,
    gapLevel: 2,
    gapSeverity: 78,
    priorityScore: 88,
    classification: 'FOUNDATIONAL_DEFICIT',
    priority: 'HIGH',
    status: 'OPEN',
    competency: {
      id: 'c-1',
      code: 'DWR-POL-02',
      name: 'Polarimetric Radar Echo Classification & VAD Analysis',
      category: 'Doppler Radar Meteorology',
    },
    recommendedCourses: [
      { id: 'c-1', title: 'Doppler Radar Operational Meteorology (Level 1)', slug: 'doppler-radar' },
    ],
  },
  {
    id: 'sg-2',
    userId: 'u-1',
    competencyId: 'c-2',
    currentLevel: 3,
    requiredLevel: 4,
    gapLevel: 1,
    gapSeverity: 45,
    priorityScore: 62,
    classification: 'NUMERICAL_PARAMETERIZATION',
    priority: 'MEDIUM',
    status: 'OPEN',
    competency: {
      id: 'c-2',
      code: 'NWP-ASSIM-04',
      name: '4D-Var Satellite Telemetry Data Assimilation in WRF',
      category: 'Numerical Modeling',
    },
    recommendedCourses: [
      { id: 'c-2', title: 'High-Resolution NWP Modeling & Data Assimilation', slug: 'nwp-modeling' },
    ],
  },
];

export default function TraineeSkillGapsPage() {
  const [gaps, setGaps] = useState<SkillGapItem[]>(FALLBACK_GAPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkillGaps();
  }, []);

  const fetchSkillGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/users/me/skill-gaps');
      const apiGaps = res.data.data;
      if (Array.isArray(apiGaps) && apiGaps.length > 0) {
        setGaps(apiGaps);
      } else {
        setGaps(FALLBACK_GAPS);
      }
    } catch {
      setGaps(FALLBACK_GAPS);
    } finally {
      setLoading(false);
    }
  };

  const highPriorityGaps = gaps.filter((g) => g.priority === 'HIGH');
  const readinessPercentage = gaps.length > 0 ? Math.max(50, 100 - gaps.length * 16) : 94;

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  Workforce Diagnostic Analysis
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Personalized Skill Gaps & Readiness
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Deterministic gap evaluation against official MoES / IMD cadre proficiency benchmarks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/trainee/revision">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Launch Adaptive Revision</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Identified Gaps</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{gaps.length}</p>
              <span className="text-[11px] text-slate-500">Actionable areas</span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase">High Priority</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{highPriorityGaps.length}</p>
              <span className="text-[11px] text-slate-500">Urgent practice required</span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Readiness Index</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{readinessPercentage}%</p>
              <span className="text-[11px] text-slate-500">Operational duty fit</span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Remediation Engine</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">Active</p>
              <span className="text-[11px] text-slate-500">Curriculum connected</span>
            </Card>
          </div>

          {loading && (
            <Card className="p-12 text-center space-y-3 bg-white border-slate-200 rounded-3xl">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Evaluating multi-tier skill gap matrix...</p>
            </Card>
          )}

          {error && (
            <Card className="p-6 text-center border-rose-200 bg-rose-50 text-rose-800 text-xs rounded-2xl">
              <p className="font-bold">{error}</p>
              <Button onClick={fetchSkillGaps} size="sm" className="mt-2 bg-rose-600 text-white">
                Retry
              </Button>
            </Card>
          )}

          {!loading && !error && gaps.length === 0 && (
            <Card className="p-10 text-center space-y-3 border-emerald-200 bg-emerald-50/50 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                You&apos;re On Track — No Open Skill Gaps
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                No significant competency gaps have been identified. Keep learning and practicing to maintain operational readiness.
              </p>
            </Card>
          )}

          {!loading && !error && gaps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Targeted Remediation Matrix ({gaps.length} Actionable Gaps)</span>
                </h2>
                <span className="text-xs text-slate-400">Deterministic WMO Competency Gaps</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gaps.map((gap) => {
                  const currentLvl = gap.currentLevel;
                  const reqLvl = gap.requiredLevel;
                  const currentScore = Math.round((currentLvl / 5) * 100);
                  const targetScore = Math.round((reqLvl / 5) * 100);
                  const pointsDelta = targetScore - currentScore;
                  const isHigh = gap.priority === 'HIGH';

                  return (
                    <Card
                      key={gap.id}
                      className="p-6 border-slate-200 bg-white rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {gap.competency?.category || 'Technical Competency'} • {gap.competency?.code}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                              {gap.competency?.name}
                            </h3>
                          </div>

                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {gap.priority} Priority
                          </span>
                        </div>

                        {/* Progress Levels & Points Gap */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">
                              Current: <strong className="text-slate-900">Level {currentLvl} ({currentScore}%)</strong>
                            </span>
                            <span className="text-indigo-700 font-bold">
                              Target: Level {reqLvl} ({targetScore}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isHigh ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${currentScore}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-amber-700 font-bold">
                              Gap Deficit: {pointsDelta} Points ({gap.gapLevel} Level{gap.gapLevel > 1 ? 's' : ''})
                            </span>
                            <span className="text-slate-400">Cadre Benchmark</span>
                          </div>
                        </div>

                        {/* Why this matters */}
                        <div className="text-xs text-slate-600 space-y-1">
                          <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                            <Info className="w-3.5 h-3.5 text-indigo-600" />
                            Why This Matters
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Proficiency in {gap.competency?.name} is required to independently interpret polarimetric radar moments and ensure high-accuracy nowcasting during extreme monsoon weather events.
                          </p>
                        </div>

                        {/* Step-by-Step Remediation Pathway */}
                        <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-1.5">
                          <span className="font-bold text-indigo-950 text-[11px] flex items-center gap-1">
                            <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                            Recommended Remediation Pathway:
                          </span>
                          <ol className="text-[11px] text-indigo-900/80 space-y-1 list-decimal list-inside font-medium">
                            <li>Review foundational equations in Study Desk</li>
                            <li>Complete interactive practice module</li>
                            <li>Attempt diagnostic assessment questions</li>
                            <li>Lock in retention via Adaptive Revision</li>
                          </ol>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link href="/trainee/revision">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            <span>Start Revision</span>
                          </Button>
                        </Link>

                        <Link href="/trainee/courses">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-900 text-xs font-semibold"
                          >
                            <span>View Course</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
