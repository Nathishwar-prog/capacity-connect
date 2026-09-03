'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Award,
  UserCheck,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Activity,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useAdminDashboard } from '../hooks/useDashboard';
import { DashboardHeader } from '../components/DashboardHeader';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const metrics = data?.metrics || {
    totalUsers: 0,
    trainees: 0,
    trainers: 0,
    administrators: 0,
    pendingApprovals: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalCompetencies: 0,
  };

  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Institutional Header */}
      <DashboardHeader
        userName={
          user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Administrator'
        }
        role={user?.role || 'ADMIN'}
        departmentName="Institutional Administration & Governance"
        portalSubtitle="Capacity development governance, trainee access management, trainer approvals, and institutional compliance."
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Directory"
          value={metrics.totalUsers}
          subtitle="Registered department personnel"
          icon={Users}
          variant="indigo"
        />
        <MetricCard
          title="Capacity Trainees"
          value={metrics.trainees}
          subtitle="Enrolled operational staff"
          icon={GraduationCap}
          variant="sky"
        />
        <MetricCard
          title="Domain Trainers"
          value={metrics.trainers}
          subtitle="Atmospheric instructors"
          icon={Award}
          variant="emerald"
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          subtitle="Awaiting administrative verification"
          icon={UserCheck}
          variant={metrics.pendingApprovals > 0 ? 'amber' : 'indigo'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Quick Access & Directory Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Institutional Actions & Management */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/users"
              className="p-5 rounded-3xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group block"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">User Directory</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Manage accounts, assign roles, and configure organization affiliations.
              </p>
            </Link>

            <div className="p-5 rounded-3xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group block">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Curriculum & Courses</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {metrics.publishedCourses} published out of {metrics.totalCourses} total modules.
              </p>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group block">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Competency Models</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {metrics.totalCompetencies} WMO & IMD operational competencies cataloged.
              </p>
            </div>
          </div>

          {/* Pending Approval Notice if any */}
          {metrics.pendingApprovals > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-amber-900">
                    {metrics.pendingApprovals} Pending Registration Requests
                  </h5>
                  <p className="text-[11px] text-amber-700">
                    Staff members require administrative approval before portal access is granted.
                  </p>
                </div>
              </div>
              <Link href="/users?status=PENDING">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-amber-600 hover:bg-amber-700 text-xs"
                >
                  Review
                </Button>
              </Link>
            </div>
          )}

          {/* Recent Administrative Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Audit Trail & Activity Log</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent platform governance events and state modifications
                </p>
              </div>
              <Link href="/users">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600">
                  <span>Open Users Console</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No Audit Logs"
                  description="Security and operational activities will be recorded here as users interact with the portal."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-left">
                        <th className="pb-3 font-semibold">User</th>
                        <th className="pb-3 font-semibold">Action</th>
                        <th className="pb-3 font-semibold">Entity</th>
                        <th className="pb-3 font-semibold text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {recentActivity.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5">
                            <span className="font-bold text-slate-900 block">{log.userName}</span>
                            {log.userEmail && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {log.userEmail}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5">
                            <Badge variant="outline">{log.action}</Badge>
                          </td>
                          <td className="py-2.5 text-slate-500">{log.entityType}</td>
                          <td className="py-2.5 text-right text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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

        {/* Right Column (1 Col): System Oversight */}
        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Portal Governance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-950 block">Multi-Tier RBAC Active</span>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                  Strict role enforcement enabled. Public registration defaults strictly to TRAINEE.
                  Administrative privileges are locked to verified personnel.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Administrators:</span>
                  <span className="font-bold text-slate-900">{metrics.administrators}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Domain Trainers:</span>
                  <span className="font-bold text-slate-900">{metrics.trainers}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Enrolled Trainees:</span>
                  <span className="font-bold text-slate-900">{metrics.trainees}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Curriculum Courses:</span>
                  <span className="font-bold text-slate-900">{metrics.totalCourses}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
