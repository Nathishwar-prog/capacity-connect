'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  GraduationCap,
  Search,
  RefreshCw,
  Star,
  Users,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Building2,
  Award,
  Clock,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminTrainersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminCapacityTrainers', searchTerm, selectedDept, selectedStatus, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/capacity-building/trainers', {
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

  const trainers = data?.data?.trainers || [];
  const departments = data?.data?.departments || [];
  const kpis = data?.data?.kpis || {
    totalTrainers: 0,
    activeTrainers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    totalAssignedTrainees: 0,
    averageCourseRating: 4.8,
  };
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedStatus('ALL');
    setPage(1);
  };

  const getWorkloadBadge = (level: string) => {
    switch (level) {
      case 'OVERLOADED':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            Overloaded (&gt;100)
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            High (51-100)
          </span>
        );
      case 'NORMAL':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Optimal (15-50)
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Low (&lt;15)
          </span>
        );
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
                <GraduationCap className="w-4 h-4" />
                <span>Instructional Faculty & Workload</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Domain Trainers Directory & Workload Command
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Instructor portfolio health, trainer-to-trainee ratio balancing, curriculum submission velocity, and instructional performance.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs transition-colors cursor-pointer"
                title="Refresh trainers"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Real Database KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Trainers
              </span>
              <div className="text-2xl font-extrabold text-slate-900">
                {isLoading ? '...' : kpis.totalTrainers.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Accredited domain experts</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Instructors
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {isLoading ? '...' : kpis.activeTrainers.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Active credentials</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Published Curricula
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">
                {isLoading ? '...' : kpis.publishedCourses.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">
                {kpis.pendingCourses} awaiting review
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Learners Mentored
              </span>
              <div className="text-2xl font-extrabold text-purple-700">
                {isLoading ? '...' : kpis.totalAssignedTrainees.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Unique enrolled trainees</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Faculty Rating
              </span>
              <div className="text-2xl font-extrabold text-amber-600 flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <span>{isLoading ? '...' : kpis.averageCourseRating}</span>
              </div>
              <span className="text-[11px] text-slate-500">Trainee course evaluations</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by instructor name, email, expertise..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-slate-50/50"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending Approval</option>
                <option value="SUSPENDED">Suspended</option>
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

          {/* Trainers Data Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading faculty workload and performance data...</p>
              </div>
            ) : isError ? (
              <div className="p-12 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-slate-900">Failed to load trainer faculty roster.</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Try Again
                </button>
              </div>
            ) : trainers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No trainers found.</p>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or department filter.
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
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Department & Cadre</th>
                      <th className="py-3 px-4">Workload Status</th>
                      <th className="py-3 px-4">Trainees</th>
                      <th className="py-3 px-4">Courses Portfolio</th>
                      <th className="py-3 px-4">Completion</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainers.map((tr: any) => (
                      <tr key={tr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs uppercase">
                              {tr.name ? tr.name[0] : 'T'}
                            </div>
                            <div className="truncate">
                              <Link
                                href={`/admin/capacity-building/trainers/${tr.id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate"
                              >
                                {tr.name}
                              </Link>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {tr.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block truncate">
                            {tr.department}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {tr.designation} • {tr.yearsExperience} yrs exp
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {getWorkloadBadge(tr.workloadLevel)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {tr.uniqueTraineesCount} learners
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {tr.allEnrollmentsCount} total seats
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {tr.publishedCourses} published
                          </div>
                          <div className="text-[10px] text-amber-600 font-medium">
                            {tr.pendingCourses > 0 ? `${tr.pendingCourses} in review` : '0 in review'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="w-20 space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-700">
                              <span>{tr.completionRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, tr.completionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{tr.averageRating}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {tr.totalReviews} reviews
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={tr.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/capacity-building/trainers/${tr.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-[11px] shadow-2xs transition-colors"
                          >
                            <span>Portfolio</span>
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
                  <span className="font-bold text-slate-900">{meta.totalPages}</span> ({meta.total} trainers)
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
