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
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  BookOpen,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';

interface Option {
  id: string;
  optionText?: string;
  text?: string;
}

interface Question {
  id: string;
  questionText?: string;
  text?: string;
  questionType?: string;
  marks: number;
  options: Option[];
}

interface AssessmentData {
  id: string;
  title: string;
  description?: string;
  subject: string;
  durationMinutes?: number;
  passingScore: number;
  courseId?: string;
  moduleId?: string;
  course?: {
    id: string;
    title: string;
  };
  module?: {
    id: string;
    title: string;
  };
  questions: Question[];
}

interface ResultData {
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds?: number;
  submittedAt?: string;
}

export default function CourseAssessmentRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  // Support both single choice (string) and multiple choice (string[])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [postSubmissionDetails, setPostSubmissionDetails] = useState<any | null>(null);

  useEffect(() => {
    if (assessmentId) {
      initAssessmentSession();
    }
  }, [assessmentId]);

  const initAssessmentSession = async () => {
    setLoading(true);
    setErrorCode(null);
    setErrorMessage(null);

    try {
      // 1. Fetch assessment data (server strictly sanitizes questions for trainees)
      const res = await apiClient.get(`/assessments/${assessmentId}`);
      const data = res.data.data;
      setAssessment(data);

      // 2. Start or resume attempt
      const attemptRes = await apiClient.post(`/assessments/${assessmentId}/attempts`);
      const attemptData = attemptRes.data.data;
      const attId = attemptData?.attempt?.id || attemptData?.id;
      setAttemptId(attId);
    } catch (err: any) {
      const status = err.response?.status;
      setErrorCode(status || 500);

      if (status === 403) {
        setErrorMessage(
          err.response?.data?.message ||
            'You do not have permission to access this assessment. You must be enrolled in the course.',
        );
      } else if (status === 404) {
        setErrorMessage(err.response?.data?.message || 'Assessment or course not found.');
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to initialize assessment session. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string, qType?: string) => {
    if (result) return;

    if (qType === 'MULTIPLE_CHOICE') {
      const current = (answers[questionId] as string[]) || [];
      if (current.includes(optionId)) {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: current.filter((id) => id !== optionId),
        }));
      } else {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: [...current, optionId],
        }));
      }
    } else {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: optionId,
      }));
    }
  };

  const handleSubmitAttempt = async () => {
    if (!assessmentId || !attemptId || !assessment) return;

    // Confirm submission
    const answeredCount = Object.keys(answers).length;
    const totalCount = assessment.questions?.length || 0;
    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalCount} questions. Are you sure you want to submit?`,
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      // Authoritative submission payload: handles single and multi-choice selections
      const formattedAnswers = assessment.questions.map((q) => {
        const sel = answers[q.id];
        const selectedOptionId = Array.isArray(sel) ? sel[0] : sel; // canonical option ID
        return {
          questionId: q.id,
          selectedOptionId: selectedOptionId || null,
        };
      }).filter((ans) => Boolean(ans.selectedOptionId));

      const res = await apiClient.post(`/assessments/${assessmentId}/attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
      });

      const attemptResult = res.data.data?.result || res.data.data;
      const score = Number(attemptResult.score ?? 0);
      const totalMarks = Number(
        attemptResult.totalPossibleMarks ??
          attemptResult.maxScore ??
          assessment.questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0),
      );
      const pct = Number(
        attemptResult.percentage ?? (totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0),
      );
      const passed = Boolean(attemptResult.passed ?? (pct >= assessment.passingScore));

      setResult({
        attemptId: attemptResult.attemptId || attemptId,
        score,
        totalMarks,
        percentage: pct,
        passed,
        timeTakenSeconds: attemptResult.timeTakenSeconds,
        submittedAt: attemptResult.submittedAt,
      });

      // Fetch post-submission details with stored explanations
      try {
        const fullResultRes = await apiClient.get(
          `/assessments/${assessmentId}/attempts/${attemptId}/result`,
        );
        setPostSubmissionDetails(fullResultRes.data.data);
      } catch (e) {
        // Fall back gracefully
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit assessment answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = assessment?.questions?.[activeQIndex];

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/trainee/courses/${courseId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Course Viewer</span>
            </Link>

            {assessment && (
              <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px] font-bold">
                {assessment.subject || 'Atmospheric Sciences'}
              </Badge>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="p-12 text-center space-y-4 rounded-3xl border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Loading Assessment Session</h3>
                <p className="text-xs text-slate-500">
                  Retrieving certified evaluation questions from MoES / IMD repository...
                </p>
              </div>
            </Card>
          )}

          {/* Error State with Precise HTTP Status differentiation */}
          {!loading && errorCode && (
            <Card className="p-8 text-center border-rose-200 bg-rose-50/70 text-rose-900 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-rose-900">
                  {errorCode === 403
                    ? 'Access Restricted'
                    : errorCode === 404
                    ? 'Assessment Not Found'
                    : 'System Error'}
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={initAssessmentSession}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/trainee/courses/${courseId}`)}
                  className="text-xs font-bold bg-white"
                >
                  Return to Course
                </Button>
              </div>
            </Card>
          )}

          {/* Active Assessment Question Runner */}
          {!loading && assessment && !result && currentQ && (
            <div className="space-y-6">
              {/* Assessment Header Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                      {assessment.subject}
                    </span>
                    {assessment.durationMinutes && (
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {assessment.durationMinutes} mins
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {assessment.title}
                  </h1>
                  {assessment.module && (
                    <p className="text-xs text-slate-500 font-medium">
                      Module: <span className="text-slate-700 font-semibold">{assessment.module.title}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      Question {activeQIndex + 1} of {assessment.questions.length}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Passing Threshold: {assessment.passingScore}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Navigator Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                {assessment.questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isActive = idx === activeQIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQIndex(idx)}
                      className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                          : isAnswered
                          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Card */}
              <Card className="p-6 sm:p-8 space-y-6 rounded-3xl border-slate-200 bg-white shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-indigo-600 uppercase tracking-wider text-[10px]">
                      Question {activeQIndex + 1} • {currentQ.questionType || 'SINGLE_CHOICE'}
                    </span>
                    <span className="font-semibold text-slate-500">
                      {currentQ.marks || 1} Point{(currentQ.marks || 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQ.questionText || currentQ.text}
                  </h3>
                </div>

                {/* Question Options UI (Section 16: Radio vs Checkbox) */}
                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt, idx) => {
                    const optText = opt.optionText || opt.text;
                    const isMulti = currentQ.questionType === 'MULTIPLE_CHOICE';
                    const isSelected = isMulti
                      ? Array.isArray(answers[currentQ.id]) &&
                        (answers[currentQ.id] as string[]).includes(opt.id)
                      : answers[currentQ.id] === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.questionType)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all text-xs sm:text-sm ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {/* Selector representation */}
                        <div
                          className={`w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isMulti ? 'rounded-md' : 'rounded-full'
                          } ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <span className="flex-1 leading-relaxed">{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Controls */}
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

          {/* Assessment Completed Result Card (Section 20) */}
          {result && (
            <Card className="p-8 sm:p-12 text-center space-y-6 border-slate-200 bg-white rounded-3xl shadow-xl max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
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
                  {result.passed ? 'Certification Standard Met' : 'Did Not Meet Passing Standard'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {result.passed ? 'Assessment Passed Successfully!' : 'Assessment Not Passed'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Your answers have been graded authoritatively by the evaluation engine.
                  Learning progress and institutional competencies have been updated in real-time.
                </p>
              </div>

              {/* Authoritative Metric Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600">
                    {result.score} / {result.totalMarks}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Points</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    {result.percentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Score Percentage</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800">
                    {assessment?.passingScore}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Passing Threshold</div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => router.push(`/trainee/courses/${courseId}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 rounded-xl shadow-sm"
                >
                  <span>Return to Course Outline</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/trainee/assessments/${assessmentId}/result/${result.attemptId}`)}
                  className="text-xs font-bold border-slate-300 hover:bg-slate-50"
                >
                  <FileCheck2 className="w-4 h-4 mr-1.5 text-indigo-600" />
                  <span>View Detailed Report</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
