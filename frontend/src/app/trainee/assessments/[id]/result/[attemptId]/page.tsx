'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Calendar,
  RotateCcw,
} from 'lucide-react';

interface ResultDetail {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  userId: string;
  score: number;
  totalPossibleMarks: number;
  passingScore: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds?: number;
  submittedAt?: string;
  answersSummary?: Array<{
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    marksObtained: number;
  }>;
}

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const attemptId = params.attemptId as string;

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      if (!assessmentId || !attemptId) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch authoritative result from backend
        const res = await apiClient.get(
          `/assessments/${assessmentId}/attempts/${attemptId}/result`,
        );
        setResult(res.data.data);

        // 2. Fetch assessment details for question text and explanation display
        try {
          const assRes = await apiClient.get(`/assessments/${assessmentId}`);
          setAssessment(assRes.data.data);
        } catch (e) {
          // Non-blocking
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load assessment result report.');
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [assessmentId, attemptId]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading certified evaluation transcript...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !result) {
    return (
      <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="max-w-4xl mx-auto py-12">
            <Card className="p-8 text-center border-rose-200 bg-rose-50 text-rose-800 space-y-3 rounded-3xl">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="text-sm font-bold">Result Unavailable</h3>
              <p className="text-xs">{error || 'Could not find the requested attempt transcript.'}</p>
              <Button
                size="sm"
                onClick={() => router.push('/trainee/courses')}
                className="bg-rose-600 text-white text-xs mt-2"
              >
                Return to My Courses
              </Button>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const durationMin = result.timeTakenSeconds
    ? Math.floor(result.timeTakenSeconds / 60)
    : 0;
  const durationSec = result.timeTakenSeconds ? result.timeTakenSeconds % 60 : 0;

  const totalQuestions = result.answersSummary?.length || assessment?.questions?.length || 0;
  const correctCount = result.answersSummary?.filter((a) => a.isCorrect).length || 0;
  const incorrectCount = totalQuestions - correctCount;

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/trainee/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to My Courses</span>
            </Link>

            <Badge
              variant="outline"
              className={
                result.passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                  : 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
              }
            >
              {result.passed ? 'Certified Pass' : 'Threshold Not Met'}
            </Badge>
          </div>

          {/* Hero Summary Card (Section 20) */}
          <Card className="p-8 sm:p-10 border-slate-200 bg-white shadow-sm rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Official Attempt Transcript
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {result.assessmentTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  {result.submittedAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(result.submittedAt).toLocaleDateString()} {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {result.timeTakenSeconds !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Time Taken: {durationMin}m {durationSec}s
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    result.passed ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-rose-600 shadow-rose-600/30'
                  }`}
                >
                  {result.passed ? <Award className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                </div>
                <div className="text-right mt-2">
                  <div className="text-2xl font-black text-slate-900">{result.percentage}%</div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Final Grade</div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown (Section 20 requirement) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Score</span>
                <span className="text-xl font-black text-indigo-600">
                  {result.score} / {result.totalPossibleMarks}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Passing Score</span>
                <span className="text-xl font-black text-slate-800">{result.passingScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Correct</span>
                <span className="text-xl font-black text-emerald-700">{correctCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                <span className="text-[10px] font-bold uppercase text-rose-600 block">Incorrect</span>
                <span className="text-xl font-black text-rose-700">{incorrectCount}</span>
              </div>
            </div>

            {/* Learning Intelligence Pipeline Status */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-indigo-950">Learning Intelligence Ingestion Complete</span>
                <p className="text-indigo-800/80 leading-relaxed">
                  Topic mastery vectors, memory retention curves, and institutional skill gaps have been updated
                  in the MoES adaptive revision engine.
                </p>
              </div>
            </div>
          </Card>

          {/* Question Level Review (Section 20: Feedback and Stored Explanations) */}
          {result.answersSummary && result.answersSummary.length > 0 && assessment?.questions && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Question Performance Review</h3>

              <div className="space-y-3">
                {assessment.questions.map((q: any, idx: number) => {
                  const summary = result.answersSummary?.find((a) => a.questionId === q.id);
                  const isCorrect = summary?.isCorrect ?? false;
                  const selectedOpt = q.options?.find((o: any) => o.id === summary?.selectedOptionId);

                  return (
                    <Card
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-200 bg-white'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Question {idx + 1}
                            </span>
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Correct (+{q.marks || 1} pt)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" /> Incorrect (0 pts)
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {q.questionText || q.text}
                          </h4>

                          {selectedOpt && (
                            <p className="text-xs text-slate-600 pt-1">
                              <span className="font-semibold text-slate-500">Your Answer: </span>
                              <span className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-medium'}>
                                {selectedOpt.optionText || selectedOpt.text}
                              </span>
                            </p>
                          )}

                          {q.explanation && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1">
                              <span className="font-bold text-slate-700 block text-[11px]">Explanation:</span>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => router.push('/trainee/courses')}
              className="text-xs font-bold border-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Return to My Courses
            </Button>

            {assessment?.courseId && (
              <Button
                onClick={() => router.push(`/trainee/courses/${assessment.courseId}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 shadow-sm"
              >
                <span>Continue Course</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
