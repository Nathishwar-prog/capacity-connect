'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Library,
  Search,
  RefreshCw,
  Filter,
  FileText,
  Video,
  Presentation,
  Link2,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminLearningResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminCapacityResources', searchTerm, selectedType, selectedStatus, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/capacity-building/resources', {
        params: {
          search: searchTerm || undefined,
          resourceType: selectedType !== 'ALL' ? selectedType : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          page,
          limit,
        },
      });
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const resources = data?.data?.resources || [];
  const kpis = data?.data?.kpis || {
    totalResources: 0,
    publishedResources: 0,
    pendingReview: 0,
    addedThisMonth: 0,
    typeCounts: {},
  };
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setPage(1);
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-sky-500" />;
      case 'PRESENTATION':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'LINK':
        return <Link2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <FolderOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Library className="w-4 h-4" />
                <span>Instructional Assets & Curricula Resources</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Learning Resources & Digital Assets Repository
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Centralized management of course readings, scientific documents, video lectures, and syllabus attachments.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs transition-colors cursor-pointer"
                title="Refresh resources"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Real Database KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Resources
              </span>
              <div className="text-2xl font-extrabold text-slate-900">
                {isLoading ? '...' : kpis.totalResources.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Learning materials registered</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Published & Active
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {isLoading ? '...' : kpis.publishedResources.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Available to trainees</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pending Verification
              </span>
              <div className="text-2xl font-extrabold text-amber-700">
                {isLoading ? '...' : kpis.pendingReview.toLocaleString()}
              </div>
              <span className="text-[11px] text-amber-600 font-semibold">Awaiting review</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Added This Month
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">
                {isLoading ? '...' : `+${kpis.addedThisMonth}`}
              </div>
              <span className="text-[11px] text-slate-500">Recent asset uploads</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search resources by title, description, filename..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-slate-50/50"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">All Media Types</option>
                <option value="PDF">PDF Documents</option>
                <option value="VIDEO">Video Recordings</option>
                <option value="PRESENTATION">Presentations</option>
                <option value="DOCUMENT">Text Documents</option>
                <option value="LINK">External References</option>
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
                <option value="PUBLISHED">Published</option>
                <option value="PENDING_APPROVAL">Pending Review</option>
                <option value="DRAFT">Draft</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {(searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors self-end md:self-auto cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Resources Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading resources catalog...</p>
              </div>
            ) : isError ? (
              <div className="p-12 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-slate-900">Failed to load learning resources.</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Try Again
                </button>
              </div>
            ) : resources.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Library className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No learning resources found.</p>
                <p className="text-xs text-slate-400">
                  Try adjusting your search criteria or media type filter.
                </p>
                {(searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL') && (
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
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Attached Curricula</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Usage</th>
                      <th className="py-3 px-4">Uploaded Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((res: any) => (
                      <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                              {getResourceTypeIcon(res.resourceType)}
                            </div>
                            <div className="truncate max-w-xs sm:max-w-sm">
                              <Link
                                href={`/admin/capacity-building/learning-resources/${res.id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate"
                              >
                                {res.title}
                              </Link>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {res.fileName || res.description || 'No filename'} {res.fileSize ? `(${formatFileSize(res.fileSize)})` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200 uppercase">
                            {res.resourceType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {res.attachedCourses && res.attachedCourses.length > 0 ? (
                            <span className="font-semibold text-slate-800 block truncate max-w-xs">
                              {res.attachedCourses[0].title}
                              {res.attachedCourses.length > 1 && (
                                <span className="text-[10px] text-slate-400 ml-1">
                                  +{res.attachedCourses.length - 1} more
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unattached asset</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          {res.uploader ? (
                            <div>
                              <span className="font-semibold block">{res.uploader.name}</span>
                              <span className="text-[10px] text-slate-400">{res.uploader.role}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">System Admin</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">
                            {res.usageCount} {res.usageCount === 1 ? 'place' : 'places'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={res.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/capacity-building/learning-resources/${res.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-[11px] shadow-2xs transition-colors"
                          >
                            <span>Inspect</span>
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
                  <span className="font-bold text-slate-900">{meta.totalPages}</span> ({meta.total} resources)
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
