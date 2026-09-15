'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useTrainerTrainees, useTrainerCourses } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Loader2,
} from 'lucide-react';

export default function TrainerTraineesPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerTraineesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerTraineesContent() {
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [progressFilter, setProgressFilter] = useState<'ALL' | 'COMPLETED' | 'ON_TRACK' | 'AT_RISK'>('ALL');

  let progressMin: number | undefined;
  let progressMax: number | undefined;

  if (progressFilter === 'COMPLETED') {
    progressMin = 90;
  } else if (progressFilter === 'ON_TRACK') {
    progressMin = 30;
    progressMax = 89;
  } else if (progressFilter === 'AT_RISK') {
    progressMax = 29;
  }

  const { data: coursesData } = useTrainerCourses();
  const { data, isLoading } = useTrainerTrainees({
    search: search || undefined,
    courseId: selectedCourseId || undefined,
    progressMin,
    progressMax,
  });

  const trainees = data?.trainees || [];
  const courses = coursesData?.courses || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Trainees
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 border-indigo-200 bg-indigo-50">
              Trainer Scoped Cohorts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervise scientific trainee cohorts enrolled in your atmospheric sciences courses
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Progress Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All Cohorts' },
            { key: 'ON_TRACK', label: 'In Progress (30-89%)' },
            { key: 'COMPLETED', label: 'Completed (>90%)' },
            { key: 'AT_RISK', label: 'At Risk (<30%)' },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setProgressFilter(pill.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                progressFilter === pill.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Course selector */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Instructed Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Trainees List Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Enrolled Learners ({trainees.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : trainees.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No trainees found matching the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Trainee</th>
                    <th className="py-3 px-4">Department & Cadre</th>
                    <th className="py-3 px-4">Enrolled Course</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainees.map((t) => (
                    <tr key={t.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{t.designation}</div>
                        <div className="text-[11px] text-slate-500">{t.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900">{t.courseTitle}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] font-semibold mb-1">
                            <span className="text-slate-600">{t.progress}%</span>
                            {t.progress < 30 && (
                              <span className="text-rose-600 text-[9px] font-bold">Lagging</span>
                            )}
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                t.progress >= 70
                                  ? 'bg-emerald-500'
                                  : t.progress >= 30
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={t.status === 'COMPLETED' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/trainer/trainees/${t.traineeId}`}>
                          <Button size="sm" variant="ghost" className="text-xs text-indigo-600 font-bold hover:bg-indigo-50">
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
