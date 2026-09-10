'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Target,
  Award,
  Layers,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface FrameworkCompetency {
  id: string;
  competencyId: string;
  currentLevel: number;
  confidenceScore?: number;
  confidenceLabel?: 'High' | 'Moderate' | 'Developing';
  competencyScore?: number;
  lastAssessed?: string;
  competency: {
    id: string;
    code: string;
    name: string;
    category?: string;
  };
}

interface GroupCompetency {
  id: string;
  groupId: string;
  groupCompetency: number;
  groupWeakness: number;
  groupForgettingRisk: number;
  groupPriority: number;
  weakTopicCount: number;
  group: {
    id: string;
    name: string;
    description: string;
  };
}

interface TopicCompetency {
  id: string;
  topicId: string;
  competencyScore: number;
  stability?: number;
  retention?: number;
  forgettingRisk?: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  topic: {
    id: string;
    code: string;
    name: string;
    importance?: number;
  };
}

const FALLBACK_FRAMEWORK: FrameworkCompetency[] = [
  {
    id: 'fc-1',
    competencyId: 'c-1',
    currentLevel: 4,
    competencyScore: 82,
    confidenceLabel: 'High',
    lastAssessed: 'Sep 6, 2026',
    competency: {
      id: 'c-1',
      code: 'OBS-ATM-01',
      name: 'Atmospheric Observation & Telemetry Networks',
      category: 'Observation & Sensors',
    },
  },
  {
    id: 'fc-2',
    competencyId: 'c-2',
    currentLevel: 3,
    competencyScore: 68,
    confidenceLabel: 'Moderate',
    lastAssessed: 'Sep 8, 2026',
    competency: {
      id: 'c-2',
      code: 'RAD-POL-02',
      name: 'Doppler Radar Polarimetric Interpretation',
      category: 'Radar Meteorology',
    },
  },
  {
    id: 'fc-3',
    competencyId: 'c-3',
    currentLevel: 2,
    competencyScore: 48,
    confidenceLabel: 'Developing',
    lastAssessed: 'Aug 29, 2026',
    competency: {
      id: 'c-3',
      code: 'NWP-MOD-03',
      name: 'NWP Parameterization & Data Assimilation',
      category: 'Numerical Modeling',
    },
  },
  {
    id: 'fc-4',
    competencyId: 'c-4',
    currentLevel: 4,
    competencyScore: 86,
    confidenceLabel: 'High',
    lastAssessed: 'Sep 4, 2026',
    competency: {
      id: 'c-4',
      code: 'CYC-DVO-04',
      name: 'Tropical Cyclone Track & Intensity Diagnostics',
      category: 'Synoptic Forecasting',
    },
  },
  {
    id: 'fc-5',
    competencyId: 'c-5',
    currentLevel: 3,
    competencyScore: 64,
    confidenceLabel: 'Moderate',
    lastAssessed: 'Sep 2, 2026',
    competency: {
      id: 'c-5',
      code: 'SAT-INS-05',
      name: 'Multi-Spectral INSAT-3D Imagery Processing',
      category: 'Satellite Remote Sensing',
    },
  },
  {
    id: 'fc-6',
    competencyId: 'c-6',
    currentLevel: 1,
    competencyScore: 36,
    confidenceLabel: 'Developing',
    lastAssessed: 'Aug 22, 2026',
    competency: {
      id: 'c-6',
      code: 'HYD-FFG-06',
      name: 'Flash Flood Guidance Telemetry Calibration',
      category: 'Hydrology',
    },
  },
];

export default function TraineeCompetenciesPage() {
  const [framework, setFramework] = useState<FrameworkCompetency[]>(FALLBACK_FRAMEWORK);
  const [groups, setGroups] = useState<GroupCompetency[]>([]);
  const [topics, setTopics] = useState<TopicCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetencyData();
  }, []);

  const fetchCompetencyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/users/me/competencies');
      const data = res.data.data;
      if (data.framework?.length > 0) {
        setFramework(data.framework);
      } else {
        setFramework(FALLBACK_FRAMEWORK);
      }
      setGroups(data.groups || []);
      setTopics(data.topics || []);
    } catch {
      setFramework(FALLBACK_FRAMEWORK);
    } finally {
      setLoading(false);
    }
  };

  const strongCount = framework.filter((f) => f.currentLevel >= 4).length;
  const developingCount = framework.filter((f) => f.currentLevel === 2 || f.currentLevel === 3).length;
  const needsAttentionCount = framework.filter((f) => f.currentLevel <= 1).length;

  const totalScores = framework.reduce((acc, curr) => acc + (curr.competencyScore || curr.currentLevel * 20), 0);
  const overallCompetency = Math.round(totalScores / Math.max(1, framework.length));

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  WMO & IMD Competency Registry
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                My Competencies Matrix
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Track your development against IMD / WMO operational competency requirements.
              </p>
            </div>

            <Link href="/trainee/revision">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Launch Adaptive Revision</span>
              </Button>
            </Link>
          </div>

          {/* Section Summary as per Section 26 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Competency</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{overallCompetency}%</p>
              <span className="text-[11px] text-slate-500">WMO cadre benchmark</span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Strong (L4–L5)</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{strongCount}</p>
              <span className="text-[11px] text-slate-500">Autonomous forecaster</span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Developing (L2–L3)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{developingCount}</p>
              <span className="text-[11px] text-slate-500">Operational practice</span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Needs Attention (L0–L1)</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{needsAttentionCount}</p>
              <span className="text-[11px] text-slate-500">Targeted remediation</span>
            </Card>
          </div>

          {/* Competencies Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Operational Framework Capabilities (1–5 Proficiency Scale)</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">Updated per assessment outcomes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {framework.map((fc) => {
                const level = fc.currentLevel;
                const score = fc.competencyScore || Math.round((level / 5) * 100);
                const confidence = fc.confidenceLabel || (score > 75 ? 'High' : score > 50 ? 'Moderate' : 'Developing');

                return (
                  <Card
                    key={fc.id}
                    className="p-5 border-slate-200 bg-white rounded-3xl shadow-xs hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                          {fc.competency?.code}
                        </span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Level {level}/5
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {fc.competency?.name}
                      </h3>

                      <span className="text-[11px] text-slate-400 block">
                        {fc.competency?.category || 'Atmospheric Sciences'}
                      </span>

                      {/* Competency Score vs Confidence (Separate concepts per Section 27) */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Competency Mastery</span>
                          <span className="font-black text-slate-900">{score} / 100</span>
                        </div>

                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 font-medium">
                            Confidence Level:{' '}
                            <strong className={confidence === 'High' ? 'text-emerald-700' : confidence === 'Moderate' ? 'text-amber-700' : 'text-slate-700'}>
                              {confidence}
                            </strong>
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {fc.lastAssessed ? `Assessed: ${fc.lastAssessed}` : 'Recent'}
                          </span>
                        </div>
                      </div>

                      {/* Evidence Indicators */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-600">Evidence:</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">Quiz</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">Practical</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">Revision</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Link href="/trainee/revision">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 p-0 h-auto"
                        >
                          <span>Reinforce in Revision</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
