'use client';

import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Award,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useTraineeDashboard } from '../hooks/useDashboard';
import { DashboardHeader } from '../components/DashboardHeader';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

export const TraineeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useTraineeDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const metrics = data?.metrics || {
    inProgressCourses: 0,
    completedCourses: 0,
    pendingAssessments: 0,
    competenciesTracked: 0,
  };

  const activeCourses = data?.activeCourses || [];
  const assessments = data?.assessments || [];
  const competencies = data?.competencies || [];
  const recommendations = data?.recommendations || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Institutional Header */}
      <DashboardHeader
        userName={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Trainee'}
        role="TRAINEE"
        departmentName={user?.departmentName || 'Meteorological Operations'}
        portalSubtitle="Track your atmospheric sciences training modules, competency progression, and certified learning pathways."
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Courses in Progress"
          value={metrics.inProgressCourses}
          subtitle="Active learning modules"
          icon={BookOpen}
          variant="indigo"
        />
        <MetricCard
          title="Completed Pathways"
          value={metrics.completedCourses}
          subtitle="Certified curriculum"
          icon={CheckCircle2}
          variant="emerald"
        />
        <MetricCard
          title="Pending Assessments"
          value={metrics.pendingAssessments}
          subtitle="Evaluations awaiting attempt"
          icon={FileCheck2}
          variant="amber"
        />
        <MetricCard
          title="Competencies Tracked"
          value={metrics.competenciesTracked}
          subtitle="WMO / IMD aligned skills"
          icon={Award}
          variant="sky"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Courses & Assessments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Continue Learning</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick up where you left off in your enrolled meteorological modules
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600">
                <span>View All Courses</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {activeCourses.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Active Enrollments"
                  description="You are not currently enrolled in any courses. Browse the MoES & IMD capacity curriculum to start learning."
                  actionLabel="Explore Course Catalog"
                  onAction={() => {}}
                />
              ) : (
                <div className="space-y-4">
                  {activeCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{course.title}</span>
                          <Badge variant="outline">{course.difficulty}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Category: {course.category}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 min-w-[180px]">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Progress</span>
                            <span>{Math.round(course.progressPercentage)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${course.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                        <Button size="sm" variant="default" className="text-[11px] shrink-0">
                          Resume
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Assessments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Upcoming & Recent Assessments</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled evaluations and practical scenario testing
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <EmptyState
                  icon={FileCheck2}
                  title="No Pending Assessments"
                  description="You have no assessments scheduled at this time. Upcoming evaluations will appear here once assigned."
                />
              ) : (
                <div className="space-y-3">
                  {assessments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-slate-900">{a.title}</h5>
                        <p className="text-[11px] text-slate-500">
                          Passing score: {a.passingScore}% •{' '}
                          {a.durationMinutes ? `${a.durationMinutes} min` : 'Untimed'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            a.status === 'COMPLETED'
                              ? 'success'
                              : a.status === 'IN_PROGRESS'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {a.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="text-xs">
                          {a.status === 'IN_PROGRESS' ? 'Continue' : 'Details'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Competency Development & Activity */}
        <div className="space-y-8">
          {/* Competency Development */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Competency Matrix</span>
              </CardTitle>
              <p className="text-xs text-slate-500">WMO & IMD verified operational proficiencies</p>
            </CardHeader>
            <CardContent>
              {competencies.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No Competencies Mapped"
                  description="Complete course assessments or request trainer evaluation to map operational competencies."
                />
              ) : (
                <div className="space-y-3">
                  {competencies.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-[11px] font-extrabold text-indigo-600">
                          Level {c.currentLevel}/5
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${(c.currentLevel / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Resources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Recommended Pathways</span>
              </CardTitle>
              <p className="text-xs text-slate-500">Curated based on your department role</p>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <EmptyState
                  icon={Compass}
                  title="No Recommendations"
                  description="Recommendations will be generated as you engage with learning pathways."
                />
              ) : (
                <div className="space-y-2.5">
                  {recommendations.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1"
                    >
                      <span className="text-xs font-bold text-slate-900 block">
                        {r.courseTitle || r.resourceTitle}
                      </span>
                      {r.reason && (
                        <p className="text-[11px] text-slate-500 leading-snug">{r.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No Recent Activity"
                  description="Your recent learning progress and assessment milestones will be logged here."
                />
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">{act.action}</span>
                        <p className="text-[11px] text-slate-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TraineeDashboard;
