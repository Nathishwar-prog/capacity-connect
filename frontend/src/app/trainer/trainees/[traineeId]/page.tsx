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
  BrainCircuit,
  Sparkles,
  Flame,
  Activity,
  History,
  TrendingUp,
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

  const {
    profile,
    enrolledCourses,
    competencies,
    skillGaps,
    assessments,
    topicCompetencies = [],
    learningEvents = [],
    revisionActivity,
  } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top breadcrumb */}
      <Link
        href="/trainer/trainees"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to My Trainees</span>
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
                  {profile.designation || 'Scientific Trainee'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.department || 'Meteorology & Climatology'} • {profile.organization || 'IMD / MoES'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.email}</p>
            </div>
          </div>

          {/* Revision Engine Activity Stats */}
          {revisionActivity && revisionActivity.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="text-center px-2">
                <span className="text-lg font-black text-indigo-600 block">
                  {revisionActivity.length}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Drill Sessions
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center px-2">
                <span className="text-lg font-black text-emerald-600 block">
                  {Math.round(
                    revisionActivity.filter((s) => s.score !== null).length > 0
                      ? revisionActivity
                          .filter((s) => s.score !== null)
                          .reduce((acc, cur) => acc + (cur.score ?? 0), 0) /
                          revisionActivity.filter((s) => s.score !== null).length
                      : 0
                  )}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Retention Rate
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Left Courses Progress, Right Competencies & Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Enrolled Courses with Module Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Enrolled Courses Under Your Instruction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
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

          {/* Adaptive Revision Engine: Topic Competency & Forgetting Risk Matrix */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-amber-500" />
                  <span>Adaptive Revision Engine Telemetry</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold text-amber-700 border-amber-200 bg-amber-50">
                  Spaced Repetition
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {topicCompetencies.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No individual topic mastery telemetry recorded yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topicCompetencies.map((topic) => {
                    const isHighDecay = topic.forgettingRisk > 50;
                    return (
                      <div
                        key={topic.topicId}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {topic.topicTitle}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            Priority: {Math.round(topic.priorityScore)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Mastery:</span>
                          <span className="font-black text-indigo-600">{Math.round(topic.competencyScore)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.round(topic.competencyScore))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>Forgetting Risk:</span>
                          <span className={`font-bold ${isHighDecay ? 'text-rose-600' : 'text-slate-700'}`}>
                            {Math.round(topic.forgettingRisk)}% {isHighDecay ? '(Urgent)' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Attempts */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Assessment Attempts & Scores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
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
                        <Badge variant={a.passed ? 'success' : 'destructive'} className="text-[10px]">
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

        {/* Right Column (1 Col): Competencies, Gaps & Learning Telemetry Timeline */}
        <div className="space-y-6">
          {/* Competency Levels */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Competency Benchmark</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {competencies.length === 0 ? (
                <p className="text-xs text-slate-500">No tracked competencies.</p>
              ) : (
                competencies.map((comp) => (
                  <div key={comp.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">{comp.name}</span>
                      <span className="font-bold text-indigo-600">Level {comp.currentLevel} / 5</span>
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
          <Card className="rounded-3xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Scientific Skill Gaps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {skillGaps.length === 0 ? (
                <p className="text-xs text-slate-500">No active skill gaps flagged for this trainee.</p>
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

          {/* Recent Diagnostic / Learning Events Timeline */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Recent Learning Telemetry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {learningEvents.length === 0 ? (
                <p className="text-xs text-slate-400">No recent learning event stream found.</p>
              ) : (
                learningEvents.map((event) => (
                  <div key={event.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                        {event.eventType.replace('_', ' ')}
                      </span>
                      {event.correct !== null && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${
                            event.correct ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-rose-700 border-rose-200 bg-rose-50'
                          }`}
                        >
                          {event.correct ? 'Correct' : 'Needs Review'}
                        </Badge>
                      )}
                    </div>
                    {event.topicTitle && (
                      <div className="text-[11px] font-medium text-slate-600 truncate">
                        {event.topicTitle}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      {new Date(event.occurredAt).toLocaleString()}
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
