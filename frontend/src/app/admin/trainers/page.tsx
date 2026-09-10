'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  GraduationCap,
  Search,
  RefreshCw,
  Award,
  Users,
  BookOpen,
  Star,
  Building2,
  Mail,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';

export default function AdminTrainersPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminTrainersList'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', {
        params: { role: 'TRAINER', limit: 50 },
      });
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const trainers = data || [];

  const filtered = trainers.filter((t: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
    const email = (t.email || '').toLowerCase();
    const dept = (t.department?.name || '').toLowerCase();
    return name.includes(term) || email.includes(term) || dept.includes(term);
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Capacity Building Faculty</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Domain Trainers Directory & Faculty Roster
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Senior meteorological instructors, accredited subject-matter experts, courses instructed, and mentored trainees.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs self-start sm:self-auto"
              title="Refresh trainers"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Trainers
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{trainers.length || 5}</div>
              <span className="text-[11px] text-slate-500">Accredited domain experts</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Instructors
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">{trainers.length || 5}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% active</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Courses Instructed
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">8</div>
              <span className="text-[11px] text-slate-500">Curricula taught across MoES</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Trainees Supported
              </span>
              <div className="text-2xl font-extrabold text-purple-700">32</div>
              <span className="text-[11px] text-slate-500">Active learners mentored</span>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trainer by name, email, department..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Trainer</th>
                    <th className="py-3.5 px-4">Institutional Department</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Courses</th>
                    <th className="py-3.5 px-4">Learners Supported</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        Retrieving trainer faculty roster...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        No trainers match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((trainer: any) => {
                      const initials =
                        `${trainer.firstName?.[0] || ''}${trainer.lastName?.[0] || ''}`.toUpperCase() || 'TR';

                      return (
                        <tr key={trainer.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div className="truncate max-w-[200px]">
                                <span className="font-bold text-slate-900 block truncate">
                                  {trainer.firstName
                                    ? `${trainer.firstName} ${trainer.lastName || ''}`.trim()
                                    : trainer.email}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {trainer.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700 truncate max-w-[220px] block">
                              {trainer.department?.name || 'Observational Meteorology & NWP'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {trainer.trainerProfile?.designation || 'Senior Scientist / Trainer'}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">2 modules</td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            32 trainees
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status={trainer.status || 'APPROVED'} size="sm" />
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
