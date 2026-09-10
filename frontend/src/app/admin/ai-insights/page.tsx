'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Sparkles,
  Brain,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

export default function AdminAiInsightsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>('doppler');

  const topicDossiers: Record<
    string,
    {
      title: string;
      domain: string;
      learnerCount: number;
      competencyScore: number;
      forgettingRisk: string;
      importance: string;
      dependencyImpact: string;
      uncertainty: string;
      recency: string;
      recommendedAction: string;
      explanation: string;
    }
  > = {
    doppler: {
      title: 'Doppler Radial Velocity De-aliasing',
      domain: 'Radar Meteorology',
      learnerCount: 14,
      competencyScore: 42,
      forgettingRisk: 'High (68%)',
      importance: 'Critical (Core Operational Skill)',
      dependencyImpact: 'High (Blocks Severe Weather Nowcasting)',
      uncertainty: 'Low (Consistent low quiz scores across cohort)',
      recency: '16 days since last instructional module',
      recommendedAction: 'Targeted Spaced Revision Session & Simulator Practice',
      explanation:
        'This topic was prioritized because the competency score (42/100) is well below the 70% threshold, forgetting risk has reached 68% due to inactivity, and mastery of velocity de-aliasing is a mandatory prerequisite for convective nowcasting certifications.',
    },
    cape: {
      title: 'Convective Available Potential Energy (CAPE) Calculation',
      domain: 'Synoptic Meteorology',
      learnerCount: 9,
      competencyScore: 54,
      forgettingRisk: 'Medium (45%)',
      importance: 'High (Severe Thunderstorm Prediction)',
      dependencyImpact: 'Medium (Prerequisite for Instability Indexing)',
      uncertainty: 'Medium (Mixed evaluation performance)',
      recency: '11 days since last test',
      recommendedAction: 'Algorithmic MCQ Knowledge Reinforcement',
      explanation:
        'Prioritized due to moderate score deterioration. Learners understand parcel theory but struggle with moisture profile integration in tephigrams.',
    },
    nwp: {
      title: 'Baroclinic Instability & Primitive Equation Solvers',
      domain: 'Numerical Weather Prediction',
      learnerCount: 11,
      competencyScore: 51,
      forgettingRisk: 'Medium (41%)',
      importance: 'High (NWP Model Diagnostic)',
      dependencyImpact: 'High (Underpins Ensemble Data Assimilation)',
      uncertainty: 'Low (Systematic math bottleneck)',
      recency: '22 days since session',
      recommendedAction: 'Interactive Video Briefing + Formula Drill',
      explanation:
        'Mathematical formulation of quasi-geostrophic equations requires revision before advancing to regional WRF modeling.',
    },
  };

  const current = topicDossiers[selectedTopic] || topicDossiers.doppler;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Explainable AI & Adaptive Signals</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                AI Skill-Gap & Revision Intelligence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent, explainable capacity-building recommendations based on competency modeling, forgetting curves, and prerequisite dependencies.
              </p>
            </div>
          </div>

          {/* Top Intelligence Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Learners Requiring Revision
              </span>
              <div className="text-2xl font-extrabold text-slate-900">24</div>
              <span className="text-[11px] text-slate-500">Flagged by Ebbinghaus curve</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                High-Priority Gaps
              </span>
              <div className="text-2xl font-extrabold text-amber-700">8</div>
              <span className="text-[11px] text-slate-500">Core operational bottlenecks</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                At-Risk Topics
              </span>
              <div className="text-2xl font-extrabold text-rose-700">13</div>
              <span className="text-[11px] text-slate-500">Mastery score &lt; 55%</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Score Recovery Rate
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">+12%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Post-targeted revision</span>
            </div>
          </div>

          {/* Explainability Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topic Selectors */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prioritized Intervention Topics
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedTopic('doppler')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedTopic === 'doppler'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 block">
                      Doppler Velocity De-aliasing
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                      CRITICAL
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Radar Meteorology • 14 learners
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTopic('cape')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedTopic === 'cape'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 block">
                      CAPE Calculation & Tephigram Analysis
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      HIGH
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Synoptic Meteorology • 9 learners
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTopic('nwp')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedTopic === 'nwp'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 block">
                      Baroclinic Instability Solvers
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                      MEDIUM
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    NWP Modeling • 11 learners
                  </span>
                </button>
              </div>
            </div>

            {/* Explainability Breakdown Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <CardTitle className="text-base font-extrabold text-slate-900">
                        {current.title}
                      </CardTitle>
                      <p className="text-xs text-slate-500 font-medium">{current.domain}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      Explainable Signal
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-5 space-y-5 text-xs">
                  {/* Why this needs attention */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-indigo-600" />
                      <span>Why this needs administrative attention:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Current Cohort Competency
                        </span>
                        <div className="text-base font-extrabold text-rose-600">
                          {current.competencyScore} / 100
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Forgetting Risk Signal
                        </span>
                        <div className="text-base font-extrabold text-amber-600">
                          {current.forgettingRisk}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Curriculum Importance
                        </span>
                        <div className="text-xs font-bold text-slate-800">{current.importance}</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Prerequisite Dependency Impact
                        </span>
                        <div className="text-xs font-bold text-slate-800">
                          {current.dependencyImpact}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed pt-1 border-t border-slate-200/60">
                      {current.explanation}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                      Recommended Administrative Action
                    </span>
                    <p className="text-xs font-bold text-indigo-950">{current.recommendedAction}</p>
                    <p className="text-[11px] text-indigo-800/80">
                      Estimated duration: 25 minutes • Automatically targeted to 14 affected staff
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
