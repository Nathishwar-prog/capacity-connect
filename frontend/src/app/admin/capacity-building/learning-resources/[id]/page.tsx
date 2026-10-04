'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Library,
  ArrowLeft,
  FileText,
  Video,
  Presentation,
  Link2,
  FolderOpen,
  Calendar,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Building2,
  HardDrive,
  Download,
  Eye,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminResourceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminResourceDetail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/capacity-building/resources/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="p-16 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm font-bold text-slate-600">Loading learning resource metadata...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !data) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AppShell>
          <div className="p-16 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Resource Not Found</h2>
            <p className="text-xs text-slate-500">The requested learning resource could not be found or has been deleted.</p>
            <Link
              href="/admin/capacity-building/learning-resources"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Learning Resources</span>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-6 h-6 text-rose-500" />;
      case 'VIDEO':
        return <Video className="w-6 h-6 text-sky-500" />;
      case 'PRESENTATION':
        return <Presentation className="w-6 h-6 text-amber-500" />;
      case 'LINK':
        return <Link2 className="w-6 h-6 text-emerald-500" />;
      default:
        return <FolderOpen className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/capacity-building/learning-resources"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
                title="Back to Resources"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Learning Resource Dossier</div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {data.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={data.status} />
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Main Grid: Details & Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metadata Card (1 Col) */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
                  {getResourceTypeIcon(data.resourceType)}
                </div>
                <div className="truncate">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {data.title}
                  </h2>
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wide">
                    {data.resourceType}
                  </span>
                </div>
              </div>

              {data.description && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                  {data.description}
                </div>
              )}

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">File Name</span>
                  <span className="font-mono text-slate-800 truncate max-w-[180px]">
                    {data.fileName || 'N/A'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">File Size</span>
                  <span className="font-bold text-slate-800">{formatFileSize(data.fileSize)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">MIME Type</span>
                  <span className="font-mono text-[11px] text-slate-600">{data.mimeType || 'standard/resource'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Uploaded By</span>
                  <span className="font-bold text-slate-800">
                    {data.uploader ? data.uploader.name : 'Administrator'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Organization</span>
                  <span className="font-semibold text-slate-700">{data.organizationName}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Uploaded On</span>
                  <span className="font-medium text-slate-600">
                    {new Date(data.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Total Usage</span>
                  <span className="font-extrabold text-indigo-700">{data.usageCount} attachments</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {data.url && (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Resource URL</span>
                  </a>
                )}
              </div>
            </div>

            {/* Preview & Attached Syllabi (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Preview Panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Asset Preview & Content Verification
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {data.resourceType} Preview
                  </span>
                </div>

                {data.url ? (
                  data.resourceType === 'VIDEO' ? (
                    <div className="aspect-video w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
                      <video src={data.url} controls className="w-full h-full object-contain" />
                    </div>
                  ) : data.resourceType === 'PDF' ? (
                    <div className="w-full h-96 rounded-xl border border-slate-200 overflow-hidden">
                      <iframe src={data.url} className="w-full h-full" title={data.title} />
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                      <ExternalLink className="w-8 h-8 text-indigo-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">External Web Resource</p>
                      <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xs"
                      >
                        <span>Launch External Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )
                ) : (
                  <div className="p-12 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Internal Storage Asset</p>
                    <p className="text-[11px] font-mono text-slate-400">{data.storageKey}</p>
                  </div>
                )}
              </div>

              {/* Attached Courses & Modules */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Attached Curricula & Module Distribution
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {data.attachedCourses.length} courses • {data.attachedLessons.length} lessons
                  </span>
                </div>

                {data.attachedCourses.length === 0 && data.attachedLessons.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    This resource is not currently attached to any active course or lesson.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.attachedCourses.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{c.title}</span>
                          <span className="text-[11px] text-slate-500">{c.category}</span>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}

                    {data.attachedLessons.map((l: any) => (
                      <div
                        key={l.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{l.title}</span>
                          <span className="text-[11px] text-slate-500">
                            Module: {l.moduleTitle || 'General'} ({l.courseTitle})
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          Lesson Material
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
