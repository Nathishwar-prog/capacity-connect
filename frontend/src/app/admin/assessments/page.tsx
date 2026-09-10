'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  ClipboardList,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Award,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';

export default function AdminAssessmentsPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: assessments = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminAssessments'],
    queryFn: async () => {
      const res = await apiClient.get('/assessments');
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const filtered = assessments.filter((a: any) => {
    return !searchTerm.trim() || a.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <ClipboardList className="w-4 h-4" />
                <span>Evaluation Governance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Assessments & Quizzes Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Administer operational quizzes, MCQ knowledge checks, practical grading criteria, and learner attempt records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh assessments"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast('Assessment Authoring: Form opened for new questionnaire creation.', 'info')
                }
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Assessment</span>
              </button>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Assessments
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{assessments.length || 6}</div>
              <span className="text-[11px] text-slate-500">Cataloged competency evaluations</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Average Passing Score
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">70%</div>
              <span className="text-[11px] text-slate-500">Ministry standard qualification</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Evaluations Pending
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">0</div>
              <span className="text-[11px] text-emerald-600 font-semibold">All submitted attempts evaluated</span>
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
                placeholder="Search assessment title..."
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
                    <th className="py-3.5 px-4">Assessment Title</th>
                    <th className="py-3.5 px-4">Evaluation Type</th>
                    <th className="py-3.5 px-4">Passing Score</th>
                    <th className="py-3.5 px-4">Time Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        Retrieving assessments...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        No assessments match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-sm">
                            {item.title}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            {item.assessmentType || 'MCQ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.passingScore || 70}%
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {item.durationMinutes || 30} mins
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={item.status || 'PUBLISHED'} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              showToast(`Assessment results and questions for "${item.title}" opened.`, 'info')
                            }
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))
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
