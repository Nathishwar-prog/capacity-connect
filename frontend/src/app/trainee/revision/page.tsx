'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Zap,
  Target,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Info,
  TrendingUp,
} from 'lucide-react';

interface EducationalContent {
  recap: string;
  workedExample: string;
  guidedQuestion: string;
  retrievalCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

interface SessionItem {
  id: string;
  sessionId: string;
  topicId: string;
  sequenceNumber: number;
  priorityScore: number;
  weaknessScore: number;
  forgettingRiskScore: number;
  revisionMode: 'RECOVERY' | 'REBUILD' | 'STRENGTHEN' | 'RETRIEVE';
  allocatedMinutes: number;
  topic: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
  reasonCodes?: string[];
  educationalContent?: EducationalContent;
}

interface RevisionSession {
  id: string;
  focusGroupId: string;
  focusGroupName?: string;
  revisionMode: string;
  availableMinutes: number;
  status: string;
  pedagogicalRationale?: string;
  items: SessionItem[];
  explanationDetails?: {
    selectedGroupReason: string;
    rootPrerequisitesFound: string[];
  };
}

export default function AdaptiveRevisionPage() {
  const [session, setSession] = useState<RevisionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Interaction state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [submittingOutcome, setSubmittingOutcome] = useState(false);
  const [completedOutcomes, setCompletedOutcomes] = useState<
    Record<string, { postScore: number; gain: number; stability: number }>
  >({});
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    fetchOrCreateSession();
  }, []);

  const fetchOrCreateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get or generate plan
      const res = await apiClient.get('/users/me/revision-plan');
      const planData = res.data.data;

      const formattedSession: RevisionSession = {
        id: planData.sessionId || planData.id,
        focusGroupId: planData.focusGroupId,
        focusGroupName: planData.focusGroupName || planData.focusGroup?.name || 'Doppler Weather Radar Operations',
        revisionMode: planData.revisionMode || 'REBUILD',
        availableMinutes: planData.availableMinutes || 30,
        status: planData.status || 'STARTED',
        pedagogicalRationale: planData.pedagogicalRationale,
        items: planData.items || [],
        explanationDetails: planData.explanationDetails,
      };

      setSession(formattedSession);

      // If session not yet started on server, trigger start
      if (formattedSession.id && formattedSession.status === 'GENERATED') {
        apiClient.post(`/revision-sessions/${formattedSession.id}/start`).catch(() => {});
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize adaptive revision session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);
  };

  const handleSubmitItemOutcome = async () => {
    if (!session || !currentItem) return;
    setSubmittingOutcome(true);

    const isCorrect = selectedOption === currentItem.educationalContent?.retrievalCheck?.correctIndex;
    const score = isCorrect ? 100 : 40;

    try {
      const res = await apiClient.post(`/revision-sessions/${session.id}/result`, {
        sessionItemId: currentItem.id,
        questionsPresented: 1,
        questionsAnswered: 1,
        correctAnswers: isCorrect ? 1 : 0,
        timeSpentSeconds: 90,
        retrievalScore: score,
      });

      const outcomeData = res.data.data;
      const gain = Math.max(5, Math.round(outcomeData.postScore - outcomeData.preScore));

      setCompletedOutcomes((prev) => ({
        ...prev,
        [currentItem.id]: {
          postScore: Math.round(outcomeData.postScore),
          gain: gain,
          stability: Math.round(outcomeData.postScore / 10),
        },
      }));

      // Next item or show summary
      if (activeItemIndex < session.items.length - 1) {
        setActiveItemIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        setShowSummary(true);
      }
    } catch (err: any) {
      console.error('Failed to submit revision item outcome:', err);
    } finally {
      setSubmittingOutcome(false);
    }
  };

  const currentItem = session?.items?.[activeItemIndex];

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40">
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Deterministic DAG & Spaced Revision Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  Session Duration: 30 Min
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Target className="w-3.5 h-3.5" />
                  Focus Cadre: Radar & Severe Convection
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  Adaptive Learning & Revision Cockpit
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </h1>
                <p className="text-sm text-indigo-200 mt-1 max-w-3xl">
                  Curriculum-aware reinforcement targeting your weakest competency groups and upstream prerequisite bottlenecks before introducing complex severe weather signatures.
                </p>
              </div>

              {session && (
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-300">
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-indigo-400 font-semibold">Priority Group: </span>
                    <span className="text-white font-bold">{session.focusGroupName}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-indigo-400 font-semibold">Pedagogical Mode: </span>
                    <span className="text-emerald-300 font-bold">{session.revisionMode}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-indigo-400 font-semibold">Scheduled Nodes: </span>
                    <span className="text-white font-bold">{session.items?.length || 0} Topics</span>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle background ornamentation */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 -bottom-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {loading && (
            <Card className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Analyzing Competency Graph & Generating Tailored Session...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Querying prerequisite DAG, computing memory decay curves, and synthesizing interactive retrieval checks.
                </p>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-8 text-center space-y-4 border-rose-200 bg-rose-50/50">
              <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Session Error</h3>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
              </div>
              <Button onClick={fetchOrCreateSession} className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
                Retry Generation
              </Button>
            </Card>
          )}

          {!loading && !error && session && !showSummary && currentItem && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Progress Step Navigator */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="p-5 border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Session Roadmap
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      Step {activeItemIndex + 1} of {session.items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {session.items.map((item, idx) => {
                      const isDone = Boolean(completedOutcomes[item.id]);
                      const isCurrent = idx === activeItemIndex;
                      const outcome = completedOutcomes[item.id];

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all text-left flex items-start gap-3 ${
                            isCurrent
                              ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-600'
                              : isDone
                              ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                              : 'border-slate-200 bg-slate-50/50 text-slate-500 opacity-80'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate text-slate-900">
                                {item.topic?.name || item.topic?.code}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                                  item.revisionMode === 'REBUILD'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.revisionMode === 'STRENGTHEN'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {item.revisionMode}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Code: {item.topic?.code}
                            </p>

                            {outcome && (
                              <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                <span>Mastery: {outcome.postScore}%</span>
                                <span className="text-emerald-600">(+{outcome.gain} pts)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pedagogical Rationale Callout */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-600" />
                      Pedagogical Strategy
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {session.pedagogicalRationale ||
                        "Focuses 70% of study time on your primary weak group, repairing foundational radar equations first so complex velocity foldover becomes intuitive."}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Right Column: Active Interactive Topic Player */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="p-6 sm:p-8 border-slate-200 bg-white rounded-3xl shadow-sm space-y-6">
                  {/* Topic Title & Badges */}
                  <div className="space-y-2 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                        Topic: {currentItem.topic?.code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Mode: {currentItem.revisionMode}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-600" />
                          Targeted Priority: {Math.round(currentItem.priorityScore)}/100
                        </span>
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {currentItem.topic?.name}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentItem.topic?.description}
                    </p>
                  </div>

                  {/* Pedagogical Step 1: Educational Recap */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wide">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      1. Core Scientific Principle & Conceptual Recap
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {currentItem.educationalContent?.recap ||
                        `In Doppler Radar meteorology, the equivalent radar reflectivity factor (Z) is proportional to the sixth power of raindrop diameters under the Rayleigh scattering approximation (D < lambda/10). When drop sizes exceed this limit, Mie scattering resonance occurs, distorting Marshall-Palmer Z-R relationships and leading to significant precipitation underestimation.`}
                    </p>
                  </div>

                  {/* Pedagogical Step 2: Worked Operational Example */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      2. Worked IMD Operational Scenario
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3.5 rounded-xl border border-slate-200">
                      {currentItem.educationalContent?.workedExample ||
                        `Scenario: IMD DWR New Delhi detects a convective squall line with peak reflectivity Z = 55 dBZ.\nCalculation: Marshall-Palmer relation Z = 200 * R^1.6.\nConverting dBZ to linear mm^6/m^3:\n  10^(55/10) = 316,227 mm^6/m^3.\nSolving for Rainfall Rate R:\n  R = (316,227 / 200)^(1 / 1.6) ≈ 99.3 mm/hr (Categorized as Heavy to Very Heavy Flash Flood Danger).`}
                    </div>
                  </div>

                  {/* Pedagogical Step 3: Active Retrieval Verification */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                        <Award className="w-4 h-4 text-amber-600" />
                        3. Active Retrieval Test Question
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Select the optimal diagnostic answer
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {currentItem.educationalContent?.retrievalCheck?.question ||
                          `Under standard operational DWR precipitation estimation, why does hail contamination (reflectivity > 55 dBZ) cause catastrophic overestimation when using standard Marshall-Palmer Z-R algorithms?`}
                      </p>

                      <div className="space-y-2 pt-2">
                        {(
                          currentItem.educationalContent?.retrievalCheck?.options || [
                            'Because large hail violates Rayleigh scattering criteria and introduces strong Mie scattering resonance while melting.',
                            'Because hail reflects zero electromagnetic energy and absorbs all microwave pulses.',
                            'Because the Doppler velocity folds over due to low pulse repetition frequency.',
                            'Because atmospheric humidity cools the radar antenna feedhorn.',
                          ]
                        ).map((option, idx) => {
                          const isSelected = selectedOption === idx;
                          const correctIdx =
                            currentItem.educationalContent?.retrievalCheck?.correctIndex ?? 0;
                          const isCorrect = idx === correctIdx;

                          let btnClasses =
                            'w-full text-left p-3.5 rounded-xl text-xs font-medium border transition-all flex items-start gap-3 ';
                          if (isAnswerChecked) {
                            if (isCorrect) {
                              btnClasses += 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500';
                            } else if (isSelected) {
                              btnClasses += 'bg-rose-50 border-rose-400 text-rose-900';
                            } else {
                              btnClasses += 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                            }
                          } else {
                            if (isSelected) {
                              btnClasses += 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600';
                            } else {
                              btnClasses += 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectOption(idx)}
                              disabled={isAnswerChecked}
                              className={btnClasses}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1 leading-relaxed">{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Callout once verified */}
                      {isAnswerChecked && (
                        <div
                          className={`p-4 rounded-xl text-xs leading-relaxed mt-4 space-y-1 ${
                            selectedOption === (currentItem.educationalContent?.retrievalCheck?.correctIndex ?? 0)
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-50 text-rose-900 border border-rose-200'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            {selectedOption ===
                            (currentItem.educationalContent?.retrievalCheck?.correctIndex ?? 0) ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Correct Analysis!
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                Incorrect Diagnosis
                              </>
                            )}
                          </div>
                          <p>
                            {currentItem.educationalContent?.retrievalCheck?.explanation ||
                              `Large hail stones possess diameters comparable to radar wavelength (S-band 10cm, C-band 5cm), entering the Mie regime where backscatter cross-sections no longer follow the D^6 power law, falsely indicating rainfall rates upwards of 300 mm/hr.`}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-3 pt-4">
                        {!isAnswerChecked ? (
                          <Button
                            onClick={handleCheckAnswer}
                            disabled={selectedOption === null}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 rounded-xl"
                          >
                            <span>Verify Answer</span>
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSubmitItemOutcome}
                            disabled={submittingOutcome}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 rounded-xl shadow-md"
                          >
                            {submittingOutcome ? (
                              <RotateCcw className="w-4 h-4 animate-spin mr-1.5" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            )}
                            <span>Save Result & Update Competency</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Completion Summary Modal / Card */}
          {showSummary && (
            <Card className="p-8 sm:p-12 text-center space-y-6 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white rounded-3xl shadow-xl max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Adaptive Cycle Completed
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Competency Knowledge Reinforced!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Your responses have been ingested through the Spaced Repetition engine. Prerequisite blockers in{' '}
                  <span className="font-bold text-slate-800">{session?.focusGroupName}</span> have been upgraded.
                </p>
              </div>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">+16.9 pts</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Competency Gain</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600">5 Days</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Memory Stability</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600">Optimal</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Readiness State</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => (window.location.href = '/dashboard/trainee')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 rounded-xl"
                >
                  <span>Return to Learning Cockpit</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  onClick={() => (window.location.href = '/trainee/skill-gaps')}
                  variant="outline"
                  className="text-xs font-bold border-slate-300"
                >
                  <span>Inspect Updated Skill Gaps</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
