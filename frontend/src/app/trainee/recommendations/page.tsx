'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  Award,
  BookOpen,
  Users,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  Brain,
  ShieldCheck,
  ArrowRight,
  Info,
  Zap,
} from 'lucide-react';

interface FactorScores {
  skillGapRelevance: number;
  competencyCoverage: number;
  prerequisiteFit: number;
  courseQuality: number;
  difficultyFit: number;
  learnerPreference: number;
}

interface RecommendedCourse {
  courseId: string;
  finalScore: number;
  matchPercentage: number;
  reasonCodes: string[];
  course?: {
    courseId?: string;
    id?: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    durationMinutes: number;
    difficulty: string;
    averageRating?: number;
    trainer?: {
      firstName: string;
      lastName: string;
    };
  };
  explanation?: {
    headline: string;
    whyRecommended: string;
    competencyOutcome: string;
  };
  factorScores?: FactorScores;
}

interface SufficiencyBreakdown {
  score: number;
  max: number;
  passed: boolean;
  details?: string;
}

interface DataSufficiency {
  status: 'READY' | 'LIMITED' | 'NEEDS_MORE_DATA' | 'BLOCKED';
  score: number;
  code: string;
  headline: string;
  message: string;
  nextAction: 'VIEW_RECOMMENDATIONS' | 'COMPLETE_PROFILE' | 'ADD_SKILLS' | 'DIAGNOSTIC_ASSESSMENT';
  breakdown?: {
    validRole: SufficiencyBreakdown;
    roleCompetencyMapping: SufficiencyBreakdown;
    currentSkills: SufficiencyBreakdown;
    skillEvidence: SufficiencyBreakdown;
    assessmentEvidence: SufficiencyBreakdown;
    learningGoals: SufficiencyBreakdown;
  };
  missingData?: string[];
  warnings?: string[];
}

interface TrainerMatchItem {
  trainerId: string;
  matchScore: number;
  rating?: number;
  yearsExperience?: number;
  reason?: string;
  name?: string;
  designation?: string;
  department?: string | null;
  matchedCompetencies?: string[];
  trainer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
    trainerProfile?: {
      designation?: string;
      yearsExperience?: number;
      averageRating?: number;
      bio?: string;
    };
  };
}

export default function TraineeRecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'COURSES' | 'SUFFICIENCY' | 'TRAINERS'>('COURSES');
  const [sufficiency, setSufficiency] = useState<DataSufficiency | null>(null);
  const [targetRole, setTargetRole] = useState<{ name: string; code: string; department?: string | null } | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [unmatchedCompetencies, setUnmatchedCompetencies] = useState<Array<{ name: string; message: string }>>([]);
  const [trainerMatches, setTrainerMatches] = useState<TrainerMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [expandedFactorId, setExpandedFactorId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const [recsRes, trainersRes] = await Promise.all([
        apiClient.get('/trainee/recommendations').catch(() => ({ data: { data: null } })),
        apiClient.get('/users/me/trainer-matches').catch(() => ({ data: { data: [] } })),
      ]);

      const recData = recsRes.data?.data;
      if (recData) {
        if (recData.sufficiency) setSufficiency(recData.sufficiency);
        if (recData.targetRole) setTargetRole(recData.targetRole);
        if (recData.recommendations) setRecommendations(recData.recommendations);
        if (recData.unmatchedCompetencies) setUnmatchedCompetencies(recData.unmatchedCompetencies);
      }

      const apiTrainers = trainersRes.data?.data || [];
      setTrainerMatches(apiTrainers);
    } catch (err) {
      console.error('Failed to load trainee recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await apiClient.post('/enrollments', { courseId });
      alert('Enrolled successfully! You can now study all lessons.');
      fetchRecommendations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrollingId(null);
    }
  };

  const isDataInsufficient =
    sufficiency && (sufficiency.status === 'BLOCKED' || sufficiency.status === 'NEEDS_MORE_DATA');

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 shadow-xs">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                  Deterministic & AI Recommendation Engine
                </span>

                {targetRole && (
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    Cadre: {targetRole.name}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Personalized Learning Pathway
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Curated courses and domain mentors mathematically aligned to your target role requirements and verified competency gaps.
              </p>
            </div>

            {/* Data Sufficiency Badge */}
            {sufficiency && (
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    sufficiency.status === 'READY'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sufficiency.status === 'LIMITED'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sufficiency.score}%
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Data Sufficiency</div>
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                    {sufficiency.status === 'READY' ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> High Precision
                      </span>
                    ) : sufficiency.status === 'LIMITED' ? (
                      <span className="text-indigo-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> More Data Needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('COURSES')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'COURSES'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Recommended Courses ({recommendations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SUFFICIENCY')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'SUFFICIENCY'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sufficiency Calibration ({sufficiency?.score || 0}%)</span>
            </button>

            <button
              onClick={() => setActiveTab('TRAINERS')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TRAINERS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Domain Mentors</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <Card className="p-12 text-center space-y-3 bg-white rounded-3xl border-slate-200">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Evaluating role competencies and querying course database...</p>
            </Card>
          )}

          {/* SMART UX PROMPT: INSUFFICIENT DATA / COLD START */}
          {!loading && isDataInsufficient && (
            <Card className="p-6 sm:p-8 bg-gradient-to-br from-amber-50/80 via-white to-indigo-50/50 border-2 border-amber-200/80 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-md">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    Data Sufficiency Notice: {sufficiency?.status} ({sufficiency?.score}%)
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {sufficiency?.headline || 'Additional Competency Data Required'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {sufficiency?.message ||
                      'We need more verified technical information regarding your current skills before we can compute trustworthy course recommendations.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 space-y-0.5">
                  <span className="font-bold text-slate-900">Recommended Next Step:</span>
                  <p className="text-[11px] text-slate-500">
                    Complete your skills profile or take a 10-minute diagnostic check to elevate your recommendation accuracy.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/trainee/onboarding">
                    <Button variant="outline" className="rounded-xl text-xs font-bold border-slate-200">
                      Edit Profile & Skills
                    </Button>
                  </Link>

                  <Link href="/trainee/diagnostic">
                    <Button className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs">
                      <Brain className="w-3.5 h-3.5" />
                      <span>Take 10-Min Diagnostic</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 1: RECOMMENDED COURSES */}
          {!loading && activeTab === 'COURSES' && (
            <div className="space-y-6">
              {/* Unmatched Competencies Banner (HARD FILTER: No Fake Courses) */}
              {unmatchedCompetencies.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600" />
                    Curriculum Availability Notice
                  </div>
                  {unmatchedCompetencies.map((uc, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 pl-5">
                      • <strong>{uc.name}</strong> is identified in your gap profile, but a dedicated published module is not currently available in the database.
                    </div>
                  ))}
                </div>
              )}

              {/* Course Recommendations List */}
              {recommendations.length === 0 && !isDataInsufficient ? (
                <Card className="p-12 text-center space-y-3 bg-white rounded-3xl border-slate-200">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Recommended Courses Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You meet all target competency levels for your current cadre role, or matching published courses are being scheduled.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => {
                    const c = rec.course;
                    const courseId = rec.courseId || c?.id || c?.courseId || '';
                    const isExpanded = expandedFactorId === courseId;

                    return (
                      <Card
                        key={courseId}
                        className="p-5 sm:p-6 bg-white rounded-3xl border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Match badge */}
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                                {rec.finalScore}% Match
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                                {c?.category}
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                                {c?.difficulty}
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {Math.round((c?.durationMinutes || 360) / 60)}h
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                              {c?.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {c?.description}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                            <Link href={`/trainee/courses/${courseId}`}>
                              <Button className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs">
                                <span>View Course & Mentors</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            <Button
                              variant="outline"
                              disabled={enrollingId === courseId}
                              onClick={() => handleEnroll(courseId)}
                              className="rounded-xl text-xs font-bold border-slate-200"
                            >
                              {enrollingId === courseId ? 'Enrolling...' : 'Quick Enroll'}
                            </Button>
                          </div>
                        </div>

                        {/* Explainable Reasoning Banner */}
                        {rec.explanation && (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-xs">
                            <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Why this course? — {rec.explanation.headline}</span>
                            </div>
                            <p className="text-[11px] text-indigo-800 leading-relaxed">
                              {rec.explanation.whyRecommended}
                            </p>
                            <div className="text-[10px] font-bold text-indigo-700 pt-0.5">
                              Outcome: {rec.explanation.competencyOutcome}
                            </div>
                          </div>
                        )}

                        {/* Multi-Factor Weight Breakdown Toggle */}
                        {rec.factorScores && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedFactorId(isExpanded ? null : courseId)}
                              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide Factor Breakdown' : 'Show 6-Factor Algorithmic Breakdown'}</span>
                              <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold">Skill Gap Match (35%)</span>
                                  <span className="font-black text-slate-800">{rec.factorScores.skillGapRelevance}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold">Competency Coverage (25%)</span>
                                  <span className="font-black text-slate-800">{rec.factorScores.competencyCoverage}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold">Prerequisite Fit (15%)</span>
                                  <span className="font-black text-slate-800">{rec.factorScores.prerequisiteFit}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold">Course Quality (10%)</span>
                                  <span className="font-black text-slate-800">{rec.factorScores.courseQuality}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold">Difficulty Fit (10%)</span>
                                  <span className="font-black text-slate-800">{rec.factorScores.difficultyFit}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold">Learner Preference (5%)</span>
                                  <span className="font-black text-slate-800">{rec.factorScores.learnerPreference}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DATA SUFFICIENCY CALIBRATION */}
          {!loading && activeTab === 'SUFFICIENCY' && sufficiency && (
            <div className="space-y-6">
              <Card className="p-6 sm:p-8 bg-white rounded-3xl border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      Deterministic Data Sufficiency State Machine
                    </h2>
                    <p className="text-xs text-slate-500">
                      Evaluates profile completeness, competency mappings, and evidence density before running recommendations.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold uppercase">Sufficiency Score</div>
                      <div className="text-2xl font-black text-indigo-600">{sufficiency.score} / 100</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                        sufficiency.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sufficiency.status === 'LIMITED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sufficiency.status}
                    </span>
                  </div>
                </div>

                {/* Signal Breakdown Cards */}
                {sufficiency.breakdown && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(sufficiency.breakdown).map(([key, item]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-2xl border ${
                          item.passed ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/50'
                        } space-y-2`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className={item.passed ? 'text-emerald-700' : 'text-slate-500'}>
                            {item.score} / {item.max}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {item.details || (item.passed ? 'Requirement satisfied.' : 'More information needed.')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actionable buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Next recommended action:{' '}
                    <strong className="text-slate-800">{sufficiency.nextAction}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href="/trainee/onboarding">
                      <Button variant="outline" className="rounded-xl text-xs font-bold">
                        Update Onboarding Profile
                      </Button>
                    </Link>
                    <Link href="/trainee/diagnostic">
                      <Button className="rounded-xl text-xs font-bold bg-indigo-600 text-white">
                        Take Diagnostic Assessment
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: DOMAIN INSTRUCTORS */}
          {!loading && activeTab === 'TRAINERS' && (
            <div className="space-y-4">
              {trainerMatches.length === 0 ? (
                <Card className="p-12 text-center space-y-3 bg-white rounded-3xl border-slate-200">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Domain Mentors Matched</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a recommended course above to view mentors specifically matched to that syllabus and competency.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trainerMatches.map((m, idx) => {
                    const trainerObj = m.trainer;
                    const name = m.name || `${trainerObj?.firstName || ''} ${trainerObj?.lastName || ''}`.trim() || 'Senior Scientist';
                    const rating = m.rating || trainerObj?.trainerProfile?.averageRating || 4.8;
                    const years = m.yearsExperience || trainerObj?.trainerProfile?.yearsExperience || 10;
                    const designation = m.designation || trainerObj?.trainerProfile?.designation || 'Operational Meteorologist';
                    const department = m.department || trainerObj?.department?.name || 'IMD';

                    return (
                      <Card
                        key={idx}
                        className="p-5 bg-white rounded-3xl border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">
                              {name[0]}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-slate-900">{name}</h4>
                              <p className="text-[11px] text-slate-500">{designation}</p>
                              <span className="text-[10px] text-slate-400 block">{department}</span>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {m.matchScore}% Match
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 border-t border-slate-100">
                          <span className="font-bold text-amber-600 flex items-center gap-1">
                            ⭐ {rating.toFixed(1)}
                          </span>
                          <span>•</span>
                          <span>{years} yrs experience</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {m.reason || trainerObj?.trainerProfile?.bio || 'Operational domain expert in satellite and radar meteorology.'}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
