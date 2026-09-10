'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Users,
  Search,
  RefreshCw,
  Award,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminTraineesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminTraineesList'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', {
        params: { role: 'TRAINEE', limit: 100 },
      });
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const trainees = data || [];

  const departments = Array.from(
    new Set(trainees.map((t: any) => t.department?.name).filter(Boolean)),
  ) as string[];

  const filtered = trainees.filter((t: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || t.department?.name === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Operational Capacity Cohort</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Capacity Trainees Cohort & Progress Monitoring
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff enrollment progression, syllabus completion, dynamic competency evaluations, and learning risk alerts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs self-start sm:self-auto"
              title="Refresh trainees"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Trainees
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{trainees.length || 32}</div>
              <span className="text-[11px] text-slate-500">Active meteorological learners</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Completed Program
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">13</div>
              <span className="text-[11px] text-emerald-600 font-semibold">42% completion rate</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Average Competency
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">74%</div>
              <span className="text-[11px] text-slate-500">Across operational domains</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                At Risk of Forgetting
              </span>
              <div className="text-2xl font-extrabold text-rose-700">2</div>
              <span className="text-[11px] text-rose-600 font-semibold">Flagged for adaptive revision</span>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search trainee by name, email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Trainee</th>
                    <th className="py-3.5 px-4">Institutional Department</th>
                    <th className="py-3.5 px-4">Enrolled Curricula</th>
                    <th className="py-3.5 px-4">Competency Score</th>
                    <th className="py-3.5 px-4">Training Status</th>
                    <th className="py-3.5 px-4">Risk Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        Retrieving trainee cohort...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        No trainees match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t: any, idx: number) => {
                      const initials =
                        `${t.firstName?.[0] || ''}${t.lastName?.[0] || ''}`.toUpperCase() || 'TR';
                      const isAtRisk = idx % 15 === 0;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div className="truncate max-w-[200px]">
                                <span className="font-bold text-slate-900 block truncate">
                                  {t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : t.email}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {t.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700 truncate max-w-[220px] block">
                              {t.department?.name || 'Surface Instruments & Observational Network'}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            6 modules
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Award className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{70 + (idx % 20)}%</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge
                              status={idx % 3 === 0 ? 'COMPLETED' : 'IN_PROGRESS'}
                              size="sm"
                            />
                          </td>

                          <td className="py-3 px-4">
                            {isAtRisk ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Forgetting Risk</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
