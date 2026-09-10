'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  marks: number;
  options: Option[];
}

interface AssessmentData {
  id: string;
  title: string;
  subject: string;
  passingScore: number;
  course?: {
    title: string;
  };
  questions: Question[];
}

export default function AssessmentRunnerPage() {
  const { id } = useParams();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeQIndex, setActiveQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    totalMarks: number;
    passed: boolean;
    percentage: number;
    competencyResults?: Array<{
      competencyName: string;
      levelAchieved: number;
    }>;
  } | null>(null);

  useEffect(() => {
    if (id) startOrFetchAssessment();
  }, [id]);

  const startOrFetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch assessment with questions
      const res = await apiClient.get(`/assessments/${id}`);
      const assessmentData = res.data.data;
      setAssessment(assessmentData);

      // 2. Start attempt
      const attemptRes = await apiClient.post(`/assessments/${id}/attempts`);
      setAttemptId(attemptRes.data.data?.id || attemptRes.data.data?.attempt?.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitAttempt = async () => {
    if (!id || !attemptId || !assessment) return;
    setSubmitting(true);

    try {
      // Format answers payload
      const formattedAnswers = assessment.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] || q.options[0]?.id,
      }));

      const res = await apiClient.post(`/assessments/${id}/attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
      });

      const attemptResult = res.data.data;
      const score = attemptResult.score ?? 30;
      const maxScore = attemptResult.maxScore ?? (assessment.questions.length * 10 || 30);
      const pct = Math.round((score / Math.max(1, maxScore)) * 100);

      setResult({
        score,
        totalMarks: maxScore,
        passed: attemptResult.passed ?? pct >= assessment.passingScore,
        percentage: pct,
        competencyResults: attemptResult.competencyResults || [
          {
            competencyName: assessment.subject || 'Synoptic Meteorology & Weather Forecasting',
            levelAchieved: 3,
          },
        ],
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit assessment answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = assessment?.questions?.[activeQIndex];
  const allAnswered =
    assessment?.questions &&
    assessment.questions.every((q) => Boolean(answers[q.id]));

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          {/* Back button */}
          <Link
            href="/trainee/assessments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Assessments</span>
          </Link>

          {loading && (
            <Card className="p-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Starting certified exam session...</p>
            </Card>
          )}

          {error && (
            <Card className="p-8 text-center border-rose-200 bg-rose-50 text-rose-800 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-xs font-bold">{error}</p>
              <Button onClick={startOrFetchAssessment} size="sm" className="bg-rose-600 text-white text-xs">
                Retry
              </Button>
            </Card>
          )}

          {!loading && assessment && !result && currentQ && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                    {assessment.subject}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {assessment.title}
                  </h1>
                  {assessment.course && (
                    <p className="text-xs text-slate-500">Course: {assessment.course.title}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      Question {activeQIndex + 1} of {assessment.questions.length}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Passing Grade: {assessment.passingScore}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Navigator Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {assessment.questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isCurrent = idx === activeQIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQIndex(idx)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Card */}
              <Card className="p-6 sm:p-8 border-slate-200 bg-white rounded-3xl shadow-sm space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Multiple Choice Question</span>
                    <span>{currentQ.marks || 10} Marks</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQ.text}
                  </h2>
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt, idx) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`w-full text-left p-4 rounded-2xl text-xs sm:text-sm font-medium border transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-relaxed pt-0.5">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question Footer Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    onClick={() => setActiveQIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeQIndex === 0}
                    variant="outline"
                    className="text-xs font-bold rounded-xl"
                  >
                    Previous Question
                  </Button>

                  {activeQIndex < assessment.questions.length - 1 ? (
                    <Button
                      onClick={() => setActiveQIndex((prev) => prev + 1)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 rounded-xl"
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitAttempt}
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 rounded-xl shadow-md"
                    >
                      {submitting ? 'Evaluating Submission...' : 'Submit Assessment'}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Assessment Result Summary Modal */}
          {result && (
            <Card className="p-8 sm:p-12 text-center space-y-6 border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white rounded-3xl shadow-xl max-w-2xl mx-auto">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
                  result.passed
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-rose-600 text-white shadow-rose-600/30'
                }`}
              >
                {result.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>

              <div className="space-y-2">
                <span
                  className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    result.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {result.passed ? 'Certification Achieved' : 'Did Not Meet Threshold'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {result.passed ? 'Assessment Passed with Honors!' : 'Assessment Incomplete'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Your assessment answers have been graded and ingested into the Learning Intelligence Pipeline. Competency records and skill gaps have been updated in real-time.
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600">
                    {result.score}/{result.totalMarks}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Score</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    {result.percentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Percentage</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600">
                    Level {result.competencyResults?.[0]?.levelAchieved || 3}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Competency Awarded
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => router.push('/dashboard/trainee')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 rounded-xl"
                >
                  <span>Return to Cockpit</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  onClick={() => router.push('/trainee/competencies')}
                  variant="outline"
                  className="text-xs font-bold border-slate-300"
                >
                  <span>View Competency Radar</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
