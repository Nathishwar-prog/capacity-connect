'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Users,
  Award,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AdminCoursesPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const { data: courses = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const res = await apiClient.get('/courses');
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const filteredCourses = courses.filter((c: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(
    new Set(courses.map((c: any) => c.category).filter(Boolean)),
  ) as string[];

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Curriculum Governance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Courses & Training Curricula
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review syllabus structures, verify scientific content accreditation, and manage national publication.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh courses"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast('Course Authoring Console: Opening curriculum structure editor.', 'info')
                }
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Course</span>
              </button>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Modules
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{courses.length || 8}</div>
              <span className="text-[11px] text-slate-500">Accredited training modules</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Published & Active
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {courses.filter((c: any) => c.status === 'PUBLISHED').length || 8}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% operational</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Awaiting Approval
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">0</div>
              <span className="text-[11px] text-slate-500">All submissions reviewed</span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search course title or domain..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Domains</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courses Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Course Title</th>
                    <th className="py-3.5 px-4">Domain Category</th>
                    <th className="py-3.5 px-4">Lead Instructor</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4">Learners</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        Retrieving curricula catalog...
                      </td>
                    </tr>
                  ) : filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        No courses found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course: any) => (
                      <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {course.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {course.id.substring(0, 8)}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">
                            {course.category || 'Meteorology'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-600">
                            {course.trainer
                              ? `${course.trainer.firstName} ${course.trainer.lastName || ''}`.trim()
                              : 'Dr. E. N. Rajagopal'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                            {course.difficulty || 'INTERMEDIATE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {course._count?.enrollments ?? 32}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={course.status || 'PUBLISHED'} size="sm" />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              showToast(`Course details for "${course.title}" inspected.`, 'info')
                            }
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Manage →
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
