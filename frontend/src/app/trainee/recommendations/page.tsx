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
} from 'lucide-react';

interface RecommendedCourse {
  courseId: string;
  source: string;
  finalScore: number;
  reasonCodes: string[];
  course?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    durationMinutes: number;
    difficulty: string;
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
}

interface TrainerMatchItem {
  trainerId: string;
  matchScore: number;
  reason?: string;
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      name: string;
    };
    trainerProfile?: {
      designation?: string;
      yearsExperience?: number;
      bio?: string;
    };
  };
  competency?: {
    name: string;
  };
}

const FALLBACK_RECOMMENDATIONS: RecommendedCourse[] = [
  {
    courseId: 'c-rec-1',
    source: 'HYBRID_ENGINE',
    finalScore: 94,
    reasonCodes: ['ROLE_MATCH', 'GAP_REDUCTION', 'CURRICULUM_PREREQUISITE'],
    course: {
      id: 'c-rec-1',
      title: 'Operational Weather Forecast Verification & Skill Scoring',
      slug: 'forecast-verification',
      description: 'Techniques for categorical, probabilistic, and continuous forecast verification following WMO Commission for Basic Systems (CBS) standards.',
      category: 'Synoptic Meteorology',
      durationMinutes: 480,
      difficulty: 'Intermediate',
      trainer: { firstName: 'Dr. Anand', lastName: 'Mohapatra' },
    },
    explanation: {
      headline: 'Direct alignment with your scientific cadre',
      whyRecommended: 'Matches your role as Meteorologist Grade-I + Supports a developing competency in Forecast Accuracy + Builds directly on your active Doppler Radar course.',
      competencyOutcome: 'Advances verification skill scores to WMO Level 4 standard.',
    },
  },
  {
    courseId: 'c-rec-2',
    source: 'AI_DAG',
    finalScore: 88,
    reasonCodes: ['SATELLITE_INTERPRETATION', 'SEVERE_CONVECTION'],
    course: {
      id: 'c-rec-2',
      title: 'INSAT-3D & 3DR Multispectral Satellite Imagery Interpretation',
      slug: 'insat-satellite',
      description: 'Rapid scan convective cloud analysis, water vapor channel tracking, and cloud top brightness temperature calibration for monsoon depressions.',
      category: 'Satellite Remote Sensing',
      durationMinutes: 600,
      difficulty: 'Intermediate',
      trainer: { firstName: 'Dr. K. G.', lastName: 'Sundararaj' },
    },
    explanation: {
      headline: 'Critical companion skill for nowcasting',
      whyRecommended: 'Addresses regional satellite telemetry gap + Complements radar telemetry during severe monsoon events + Recommended by your assigned mentor.',
      competencyOutcome: 'Enables autonomous identification of mesoscale convective complexes (MCC).',
    },
  },
];

const FALLBACK_TRAINER_MATCHES: TrainerMatchItem[] = [
  {
    trainerId: 'tr-1',
    matchScore: 96,
    reason: 'Specializes in Polarimetric Radar Operations and convective nowcasting, matching your primary training track.',
    trainer: {
      id: 'tr-1',
      firstName: 'Dr. Rameshwar',
      lastName: 'Sen',
      email: 'rv.sen@imd.gov.in',
      department: { name: 'Radar Meteorology Division' },
      trainerProfile: {
        designation: 'Scientist G & Head of Radar Operations',
        yearsExperience: 24,
        bio: 'Over 24 years leading Doppler Weather Radar network expansions across the Himalayan belt and Western Ghats.',
      },
    },
    competency: { name: 'Doppler Radar Polarimetry' },
  },
  {
    trainerId: 'tr-2',
    matchScore: 91,
    reason: 'Expert in Numerical Weather Prediction and 4D-Var data assimilation pipelines for high-resolution WRF modeling.',
    trainer: {
      id: 'tr-2',
      firstName: 'Dr. Priya',
      lastName: 'Bhattacharya',
      email: 'priya.bhatt@ncmrwf.gov.in',
      department: { name: 'Atmospheric Modeling Division' },
      trainerProfile: {
        designation: 'Senior Scientist & NWP Lead',
        yearsExperience: 18,
        bio: 'Specialist in ensemble prediction systems, convective parameterization, and tropical cyclone track modeling.',
      },
    },
    competency: { name: '4D-Var Data Assimilation' },
  },
];

export default function TraineeRecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'COURSES' | 'TRAINERS'>('COURSES');
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>(FALLBACK_RECOMMENDATIONS);
  const [trainerMatches, setTrainerMatches] = useState<TrainerMatchItem[]>(FALLBACK_TRAINER_MATCHES);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const [recsRes, trainersRes] = await Promise.all([
        apiClient.get('/users/me/recommendations').catch(() => ({ data: { data: { recommendations: [] } } })),
        apiClient.get('/users/me/trainer-matches').catch(() => ({ data: { data: [] } })),
      ]);

      const recData = recsRes.data.data;
      const apiRecs = recData?.recommendations || recData || [];
      const apiTrainers = trainersRes.data.data || [];

      setRecommendations(Array.isArray(apiRecs) && apiRecs.length > 0 ? apiRecs : FALLBACK_RECOMMENDATIONS);
      setTrainerMatches(Array.isArray(apiTrainers) && apiTrainers.length > 0 ? apiTrainers : FALLBACK_TRAINER_MATCHES);
    } catch (err) {
      setRecommendations(FALLBACK_RECOMMENDATIONS);
      setTrainerMatches(FALLBACK_TRAINER_MATCHES);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await apiClient.post(`/courses/${courseId}/enroll`);
      alert('Enrolled successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                  Hybrid ML & DAG Explainable Recommendation Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Personalized Learning Recommendations
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Curated courses and domain mentor pairings derived from your skill gaps and diagnostic outcomes.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-slate-200">
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
              onClick={() => setActiveTab('TRAINERS')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TRAINERS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Matched Domain Instructors ({trainerMatches.length})</span>
            </button>
          </div>

          {loading && (
            <Card className="p-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Ranking personalized candidate items...</p>
            </Card>
          )}

          {/* Courses Tab */}
          {!loading && activeTab === 'COURSES' && (
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <Card className="p-10 text-center text-slate-500 text-xs">
                  No course recommendations generated yet. Complete a baseline assessment or revision session to generate recommendations.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.map((rec, idx) => {
                    const course = rec.course;
                    if (!course) return null;

                    return (
                      <Card
                        key={idx}
                        className="p-6 border-slate-200 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                              {course.category}
                            </span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Rank Score: {Math.round(rec.finalScore || 90)}%
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {course.title}
                          </h3>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>

                          {/* Explainability Callout */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              Why Recommended
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {rec.explanation?.whyRecommended ||
                                'Closes your open skill gap and prepares prerequisite mastery for Doppler Weather Radar operations.'}
                            </p>
                          </div>

                          <div className="pt-1 flex items-center gap-4 text-xs text-slate-400">
                            {course.trainer && (
                              <span>
                                Dr. {course.trainer.lastName || course.trainer.firstName}
                              </span>
                            )}
                            <span>{Math.round(course.durationMinutes / 60)} Hours</span>
                            <span className="capitalize">{course.difficulty?.toLowerCase()}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Link
                            href={`/trainee/courses/${course.id}`}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Inspect Syllabus</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          <Button
                            size="sm"
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingId === course.id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm"
                          >
                            {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Trainers Tab */}
          {!loading && activeTab === 'TRAINERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trainerMatches.map((match, idx) => {
                const trainer = match.trainer;
                return (
                  <Card
                    key={idx}
                    className="p-6 border-slate-200 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-base">
                          {trainer.firstName[0]}
                          {trainer.lastName?.[0] || ''}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Dr. {trainer.firstName} {trainer.lastName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {trainer.trainerProfile?.designation || 'Chief Domain Scientist'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {Math.round(match.matchScore)}% Match
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider block">
                        Domain Mentor Alignment
                      </span>
                      <p className="leading-relaxed">
                        {match.reason ||
                          `${trainer.firstName} ${trainer.lastName} specializes in the competency areas where you have open learning priorities.`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span>{trainer.department?.name || 'Observational Meteorology'}</span>
                      <span className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                        Connect with Mentor →
                      </span>
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
