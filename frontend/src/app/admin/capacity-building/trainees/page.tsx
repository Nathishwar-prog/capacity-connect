'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  TrendingUp,
  Brain,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminTraineesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminCapacityTrainees', searchTerm, selectedDept, selectedStatus, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/capacity-building/trainees', {
        params: {
          search: searchTerm || undefined,
          departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          page,
          limit,
        },
      });
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const trainees = data?.data?.trainees || [];
  const departments = data?.data?.departments || [];
  const kpis = data?.data?.kpis || {
    totalTrainees: 0,
    activeTrainees: 0,
    newThisMonth: 0,
    totalEnrollments: 0,
    averageProgress: 0,
  };
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedStatus('ALL');
    setPage(1);
  };

  const getRelativeTimeString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 30) return `${diffInDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Capacity Building Trainees</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Trainees Cohort & Competency Monitoring
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage operational trainees, monitor learning progress, syllabus completion, and dynamic competency development.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh trainees"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Real Database KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Trainees
              </span>
              <div className="text-2xl font-extrabold text-slate-900">
                {isLoading ? '...' : kpis.totalTrainees.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Registered learners</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Trainees
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {isLoading ? '...' : kpis.activeTrainees.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Active in last 30d</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                New This Month
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">
                {isLoading ? '...' : `+${kpis.newThisMonth}`}
              </div>
              <span className="text-[11px] text-slate-500">New cohort members</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Course Enrollments
              </span>
              <div className="text-2xl font-extrabold text-purple-700">
                {isLoading ? '...' : kpis.totalEnrollments.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Total course seats</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Completion Rate
              </span>
              <div className="text-2xl font-extrabold text-sky-700">
                {isLoading ? '...' : `${kpis.averageProgress}%`}
              </div>
              <span className="text-[11px] text-sky-600 font-semibold">Across all curricula</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-slate-50/50"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending Approval</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {(searchTerm || selectedDept !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors self-end md:self-auto cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Trainees Data Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading verified trainee data...</p>
              </div>
            ) : isError ? (
              <div className="p-12 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-slate-900">Failed to load trainee directory.</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Try Again
                </button>
              </div>
            ) : trainees.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No trainees found.</p>
                <p className="text-xs text-slate-400">
                  Try adjusting your search criteria or department filter.
                </p>
                {(searchTerm || selectedDept !== 'ALL' || selectedStatus !== 'ALL') && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Trainee</th>
                      <th className="py-3 px-4">Department & Role</th>
                      <th className="py-3 px-4">Courses</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Competency</th>
                      <th className="py-3 px-4">Last Active</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainees.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs uppercase">
                              {t.name ? t.name[0] : 'U'}
                            </div>
                            <div className="truncate">
                              <Link
                                href={`/admin/capacity-building/trainees/${t.id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate"
                              >
                                {t.name}
                              </Link>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {t.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block truncate">
                            {t.department}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {t.designation}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {t.enrolledCoursesCount} enrolled
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            {t.completedCoursesCount} completed
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-700">
                              <span>{t.averageProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, t.averageProgress)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {t.competencyScore !== null ? (
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                t.competencyScore >= 75
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : t.competencyScore >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {t.competencyScore}% Evaluated
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 italic">
                              Pending diagnostic
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {getRelativeTimeString(t.lastActive)}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={t.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/capacity-building/trainees/${t.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-[11px] shadow-2xs transition-colors"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && meta.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing page <span className="font-bold text-slate-900">{meta.page}</span> of{' '}
                  <span className="font-bold text-slate-900">{meta.totalPages}</span> ({meta.total} trainees)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={meta.page >= meta.totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
