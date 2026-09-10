'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

interface AssessmentItem {
  id: string;
  courseId: string;
  title: string;
  subject: string;
  passingScore: number;
  totalQuestions?: number;
  durationMinutes?: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW';
  score?: number | null;
  course?: {
    title: string;
    category: string;
  };
  questions?: Array<{ id: string }>;
}

const FALLBACK_ASSESSMENTS: AssessmentItem[] = [
  {
    id: 'as-1',
    courseId: 'c-1',
    title: 'Doppler Radar Polarimetry & Velocity Folding Diagnostic Check',
    subject: 'Radar Meteorology',
    passingScore: 75,
    durationMinutes: 45,
    totalQuestions: 15,
    status: 'NOT_STARTED',
    course: {
      title: 'Doppler Radar Operational Meteorology (Level 1)',
      category: 'Radar Meteorology',
    },
  },
  {
    id: 'as-2',
    courseId: 'c-2',
    title: 'Synoptic Weather Analysis & Tropical Cyclogenesis Certification',
    subject: 'Synoptic Meteorology',
    passingScore: 70,
    durationMinutes: 60,
    totalQuestions: 20,
    status: 'PASSED',
    score: 84,
    course: {
      title: 'Tropical Cyclone Warning Operations SOP',
      category: 'Synoptic Forecasting',
    },
  },
  {
    id: 'as-3',
    courseId: 'c-3',
    title: 'NWP 4D-Var Observation Ingestion & Boundary Layer Evaluation',
    subject: 'Numerical Modeling',
    passingScore: 70,
    durationMinutes: 30,
    totalQuestions: 10,
    status: 'IN_PROGRESS',
    score: null,
    course: {
      title: 'High-Resolution NWP Modeling & Data Assimilation',
      category: 'Numerical Modeling',
    },
  },
];

export default function TraineeAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>(FALLBACK_ASSESSMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/assessments');
      const apiAssessments = res.data.data?.assessments || res.data.data || [];
      if (Array.isArray(apiAssessments) && apiAssessments.length > 0) {
        setAssessments(apiAssessments);
      } else {
        setAssessments(FALLBACK_ASSESSMENTS);
      }
    } catch {
      setAssessments(FALLBACK_ASSESSMENTS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assessments.filter((a) => {
    const st = a.status || 'NOT_STARTED';
    if (filterTab === 'ALL') return true;
    if (filterTab === 'PENDING') return st === 'NOT_STARTED';
    if (filterTab === 'IN_PROGRESS') return st === 'IN_PROGRESS';
    if (filterTab === 'COMPLETED') return st === 'PASSED' || st === 'FAILED' || st === 'SUBMITTED' || st === 'NEEDS_REVIEW';
    return true;
  });

  const pendingCount = assessments.filter((a) => (a.status || 'NOT_STARTED') === 'NOT_STARTED').length;
  const inProgressCount = assessments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = assessments.filter((a) => a.status === 'PASSED' || a.status === 'FAILED' || a.status === 'SUBMITTED').length;

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                  Official MoES / IMD Certifications
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Practical Assessments & Exams
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Benchmark your operational domain knowledge to verify WMO meteorological and earth science competencies.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Tests</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{assessments.length}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Pending</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">In Progress</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{inProgressCount}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Completed</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 max-w-md">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({assessments.length})
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('IN_PROGRESS')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'IN_PROGRESS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterTab('COMPLETED')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          {loading && (
            <Card className="p-12 text-center space-y-3 bg-white border-slate-200 rounded-3xl">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading certification exams...</p>
            </Card>
          )}

          {error && (
            <Card className="p-6 text-center border-rose-200 bg-rose-50 text-rose-800 text-xs rounded-2xl">
              <p className="font-bold">{error}</p>
              <Button onClick={fetchAssessments} size="sm" className="mt-2 bg-rose-600 text-white">
                Retry
              </Button>
            </Card>
          )}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((assessment) => {
                const questionCount =
                  assessment.questions?.length || assessment.totalQuestions || 10;
                const status = assessment.status || 'NOT_STARTED';
                const isPassed = status === 'PASSED';
                const isInProgress = status === 'IN_PROGRESS';
                const isCompleted = isPassed || status === 'SUBMITTED';

                let statusBadge = (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Not Started
                  </span>
                );

                if (isPassed) {
                  statusBadge = (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Passed ({assessment.score}%)
                    </span>
                  );
                } else if (isInProgress) {
                  statusBadge = (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      In Progress
                    </span>
                  );
                }

                return (
                  <Card
                    key={assessment.id}
                    className="p-6 border-slate-200 bg-white rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                          {assessment.subject || 'Atmospheric Sciences'}
                        </span>
                        {statusBadge}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {assessment.title}
                      </h3>

                      {assessment.course?.title && (
                        <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                          Associated Course: {assessment.course.title}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          {questionCount} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {assessment.durationMinutes || 45} Minutes
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-semibold">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          Pass Mark: {assessment.passingScore}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isCompleted ? 'Completed submission' : 'Immediate evaluation feedback'}
                      </span>

                      <Link href={`/trainee/assessments/${assessment.id}`}>
                        <Button
                          size="sm"
                          className={`text-xs font-bold px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <span>{isCompleted ? 'Review Answers' : isInProgress ? 'Resume Attempt' : 'Start Assessment'}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
