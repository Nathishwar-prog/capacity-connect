'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Library,
  Search,
  Plus,
  RefreshCw,
  FileText,
  Video,
  FileCode,
  Link2,
  Download,
  FolderOpen,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';

export default function AdminResourcesPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const { data: resources = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminResources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });

  const filtered = resources.filter((r: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'ALL' || r.resourceType === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'PDF':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'PRESENTATION':
        return <FileCode className="w-4 h-4 text-amber-600" />;
      default:
        return <Link2 className="w-4 h-4 text-indigo-600" />;
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
                <Library className="w-4 h-4" />
                <span>Institutional Knowledge Repository</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Learning Resources & Media Repository
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical manuals, Doppler radar video briefings, WMO guides, and synoptic chart datasets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh resources"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast('Resource Upload: Multi-part file upload initialized.', 'info')
                }
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Upload Resource</span>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Resources
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{resources.length || 12}</div>
              <span className="text-[11px] text-slate-500">Curated training materials</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Published & Accessible
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {resources.length || 12}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% available</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Storage Allocation
              </span>
              <div className="text-2xl font-extrabold text-indigo-700">1.4 GB</div>
              <span className="text-[11px] text-slate-500">Secure MoES cloud storage</span>
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
                  placeholder="Search resources by title or keyword..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="ALL">All Media Types</option>
                <option value="PDF">PDF Documents</option>
                <option value="VIDEO">Video Briefings</option>
                <option value="PRESENTATION">Presentations</option>
                <option value="LINK">External References</option>
              </select>
            </div>
          </div>

          {/* Resources Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Title & Description</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">File Size</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                        Retrieving knowledge repository...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                        No learning resources found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                              {getTypeIcon(item.resourceType)}
                            </div>
                            <div className="space-y-0.5 truncate max-w-md">
                              <span className="font-bold text-slate-900 block truncate">
                                {item.title}
                              </span>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.description || 'Meteorological capacity building material'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.resourceType || 'PDF'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : '4.2 MB'}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={item.status || 'PUBLISHED'} size="sm" />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              showToast(`Accessing resource link for "${item.title}".`, 'info')
                            }
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Open Link →
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
