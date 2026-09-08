'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useTrainerTraineeDetail } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Loader2,
  Layers,
} from 'lucide-react';

export default function TraineeDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TraineeDetailContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TraineeDetailContent() {
  const params = useParams();
  const traineeId = params.traineeId as string;

  const { data, isLoading } = useTrainerTraineeDetail(traineeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Trainee Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          This trainee is either not enrolled in your courses or does not exist.
        </p>
        <Link href="/trainer/trainees">
          <Button size="sm" variant="outline" className="mt-4 text-xs">
            Return to Trainees
          </Button>
        </Link>
      </div>
    );
  }

  const { profile, enrolledCourses, competencies, skillGaps, assessments } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top breadcrumb */}
      <Link
        href="/trainer/trainees"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Trainee Cohort</span>
      </Link>

      {/* Trainee Profile Banner */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-lg font-black">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {profile.designation}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.department} • {profile.organization}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Left Courses Progress, Right Competencies & Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Enrolled Courses with Module Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Enrolled Courses Under Your Instruction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{course.title}</h3>
                      <p className="text-[11px] text-slate-500">
                        Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">
                          {course.progressPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">Completed</span>
                      </div>
                      <Badge
                        variant={course.status === 'COMPLETED' ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {course.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Module & Lesson Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Module Progress Checklist
                    </h4>
                    {course.modules.map((mod, modIdx) => (
                      <div
                        key={mod.id}
                        className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                          <span>
                            Module {modIdx + 1}: {mod.title}
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {mod.lessons.filter((l) => l.completed).length} / {mod.lessons.length}{' '}
                            lessons
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {mod.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-2 text-[11px] text-slate-700"
                            >
                              {lesson.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              )}
                              <span className={lesson.completed ? 'font-medium' : 'text-slate-500'}>
                                {lesson.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assessment Attempts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Assessment Attempts & Scores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <p className="text-xs text-slate-500">No assessments attempted yet.</p>
              ) : (
                <div className="space-y-3">
                  {assessments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{a.assessmentTitle}</h4>
                        <span className="text-[11px] text-slate-500">{a.subject}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            {a.percentage !== null ? `${a.percentage}%` : 'Pending'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">Score</span>
                        </div>
                        <Badge
                          variant={a.passed ? 'success' : 'destructive'}
                          className="text-[10px]"
                        >
                          {a.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Competencies & Skill Gaps */}
        <div className="space-y-6">
          {/* Competency Levels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Competency Benchmark</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {competencies.length === 0 ? (
                <p className="text-xs text-slate-500">No tracked competencies.</p>
              ) : (
                competencies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">{comp.name}</span>
                      <span className="font-bold text-indigo-600">
                        Level {comp.currentLevel} / 5
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${(comp.currentLevel / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Skill Gaps Identified */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Scientific Skill Gaps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillGaps.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No active skill gaps flagged for this trainee.
                </p>
              ) : (
                skillGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{gap.competencyName}</h4>
                      <Badge variant="destructive" className="text-[9px]">
                        {gap.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                      <span>Current: L{gap.currentLevel}</span>
                      <span>Target: L{gap.requiredLevel}</span>
                      <span className="font-bold text-rose-600">Gap: -{gap.gapLevel}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
