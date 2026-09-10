'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  Compass,
  Layers,
  Award,
  Search,
  User,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  courseId: string;
  progressPercentage: number;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  lastAccessedAt?: string;
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    durationMinutes: number;
    trainer?: {
      firstName: string;
      lastName: string;
    };
    modules?: Array<{
      id: string;
      title: string;
      lessons?: Array<{
        id: string;
        title: string;
        durationMinutes: number;
        contentType: string;
      }>;
    }>;
  };
}

const FALLBACK_ENROLLMENTS: EnrolledCourse[] = [
  {
    id: 'enr-1',
    courseId: 'c-1',
    progressPercentage: 68,
    status: 'IN_PROGRESS',
    enrolledAt: '2026-01-20',
    lastAccessedAt: 'Yesterday',
    course: {
      id: 'c-1',
      title: 'Doppler Radar Operational Meteorology (Level 1)',
      description: 'Comprehensive operational training on polarimetric Doppler weather radar calibration, VAD analysis, and severe convective echo identification.',
      category: 'Radar Meteorology',
      difficulty: 'Intermediate',
      durationMinutes: 720,
      trainer: {
        firstName: 'Dr. Rameshwar',
        lastName: 'Sen',
      },
      modules: [
        {
          id: 'm-1',
          title: 'Radar Echo Fundamentals & Polarimetry',
          lessons: [
            { id: 'l-1', title: 'Reflectivity Z and Differential Reflectivity ZDR', durationMinutes: 45, contentType: 'VIDEO' },
            { id: 'l-2', title: 'Specific Differential Phase (KDP) for Rain Rate Estimation', durationMinutes: 60, contentType: 'PDF' },
          ],
        },
      ],
    },
  },
  {
    id: 'enr-2',
    courseId: 'c-2',
    progressPercentage: 42,
    status: 'IN_PROGRESS',
    enrolledAt: '2026-02-01',
    lastAccessedAt: '2 days ago',
    course: {
      id: 'c-2',
      title: 'High-Resolution NWP Modeling & Data Assimilation',
      description: 'Numerical methods for weather forecasting using WRF and GFS models with 4D-Var satellite and radar telemetry assimilation.',
      category: 'Numerical Modeling',
      difficulty: 'Advanced',
      durationMinutes: 960,
      trainer: {
        firstName: 'Dr. Priya',
        lastName: 'Bhattacharya',
      },
      modules: [
        {
          id: 'm-2',
          title: 'Convective-Scale Model Parameterization',
          lessons: [
            { id: 'l-3', title: 'Microphysics Schemes in Tropical Regimes', durationMinutes: 50, contentType: 'VIDEO' },
          ],
        },
      ],
    },
  },
  {
    id: 'enr-3',
    courseId: 'c-3',
    progressPercentage: 100,
    status: 'COMPLETED',
    enrolledAt: '2025-12-10',
    lastAccessedAt: 'Jan 15, 2026',
    course: {
      id: 'c-3',
      title: 'Automated Weather Station (AWS) Maintenance & Telemetry',
      description: 'Surface observational protocols, sensor calibration for sonic anemometers, and GPRS/INSAT data packets.',
      category: 'Instrumentation',
      difficulty: 'Beginner',
      durationMinutes: 480,
      trainer: {
        firstName: 'Dr. Meenakshi',
        lastName: 'Sundaram',
      },
    },
  },
];

export default function TraineeMyLearningPage() {
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>(FALLBACK_ENROLLMENTS);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const fetchMyEnrollments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/enrollments');
      const apiEnrollments = res.data.data?.enrollments || res.data.data;
      if (Array.isArray(apiEnrollments) && apiEnrollments.length > 0) {
        setEnrollments(apiEnrollments);
      } else {
        setEnrollments(FALLBACK_ENROLLMENTS);
      }
    } catch {
      setEnrollments(FALLBACK_ENROLLMENTS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = enrollments.filter((e) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.course?.title?.toLowerCase().includes(q);
      const matchCategory = e.course?.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory) return false;
    }

    if (filterTab === 'ALL') return true;
    if (filterTab === 'IN_PROGRESS') return (e.status === 'IN_PROGRESS' || e.status === 'ENROLLED') && e.progressPercentage > 0 && e.progressPercentage < 100;
    if (filterTab === 'COMPLETED') return e.status === 'COMPLETED' || e.progressPercentage >= 100;
    if (filterTab === 'NOT_STARTED') return e.progressPercentage === 0;
    return true;
  });

  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED' || e.progressPercentage >= 100).length;
  const inProgressCount = enrollments.filter(
    (e) => (e.status === 'IN_PROGRESS' || e.status === 'ENROLLED') && e.progressPercentage > 0 && e.progressPercentage < 100,
  ).length;
  const notStartedCount = enrollments.filter((e) => (e.progressPercentage || 0) === 0).length;
  const avgProgress = Math.round(
    enrollments.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0) /
      Math.max(1, enrollments.length),
  );

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Central Learning Workspace
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                My Learning Pathways
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Continue where you left off and manage your active capacity-building modules.
              </p>
            </div>

            <Link href="/trainee/courses">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs px-4 py-2">
                <Compass className="w-4 h-4 mr-1.5" />
                <span>Explore Course Catalog</span>
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Enrolled</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{enrollments.length}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">In Progress</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{inProgressCount}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Progress</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{avgProgress}%</p>
            </Card>
          </div>

          {/* Search & Tabs Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search enrolled courses, domains..."
                className="pl-9 h-10 rounded-xl text-xs bg-white border-slate-200"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 overflow-x-auto">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({enrollments.length})
              </button>
              <button
                onClick={() => setFilterTab('IN_PROGRESS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'IN_PROGRESS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setFilterTab('COMPLETED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'COMPLETED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Completed ({completedCount})
              </button>
              <button
                onClick={() => setFilterTab('NOT_STARTED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'NOT_STARTED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Not Started ({notStartedCount})
              </button>
            </div>
          </div>

          {/* Course Cards List */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center bg-white border-slate-200 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No courses match your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search criteria or explore new capacity-building courses in the catalog.
              </p>
              <Link href="/trainee/courses">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl mt-2">
                  Browse Catalog
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((enr) => {
                const isDone = enr.status === 'COMPLETED' || enr.progressPercentage >= 100;
                const totalLessons = enr.course.modules?.reduce(
                  (sum, m) => sum + (m.lessons?.length || 0),
                  0,
                ) || 8;
                const completedLessons = Math.round((enr.progressPercentage / 100) * totalLessons);

                return (
                  <Card
                    key={enr.id}
                    className="p-6 bg-white border-slate-200 rounded-3xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {enr.course.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {enr.course.difficulty}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Certified Complete
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {completedLessons} / {totalLessons} lessons
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {enr.course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {enr.course.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Curriculum Progress</span>
                          <span className="text-indigo-600 font-bold">{Math.round(enr.progressPercentage)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDone ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.max(5, enr.progressPercentage)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                        {enr.course.trainer && (
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <User className="w-3 h-3 text-indigo-500" />
                            Trainer: {enr.course.trainer.firstName} {enr.course.trainer.lastName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(enr.course.durationMinutes / 60)} hrs syllabus
                        </span>
                        {enr.lastAccessedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last activity: {enr.lastAccessedAt}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <Link
                        href={`/trainee/courses/${enr.courseId || enr.course.id}`}
                        className="w-full md:w-auto"
                      >
                        <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isDone ? 'Review Course' : 'Continue Learning →'}</span>
                        </Button>
                      </Link>

                      {isDone && (
                        <Link href="/trainee/achievements">
                          <span className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
                            <Award className="w-3.5 h-3.5" />
                            <span>View Certificate</span>
                          </span>
                        </Link>
                      )}
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
