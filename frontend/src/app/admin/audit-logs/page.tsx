'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RoleBadge } from '@/components/ui/RoleBadge';

export default function AdminAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminAuditLogs', page, pageSize, selectedAction, selectedEntity],
    queryFn: async () => {
      const response = await apiClient.get('/admin/audit-logs', {
        params: {
          page,
          limit: pageSize,
          action: selectedAction !== 'ALL' ? selectedAction : undefined,
          entityType: selectedEntity !== 'ALL' ? selectedEntity : undefined,
        },
      });
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const rawLogs = data?.data || [];
  const meta = data?.meta || { page: 1, limit: pageSize, total: rawLogs.length, totalPages: 1 };

  // Filter on client if searching by name/email
  const filteredLogs = rawLogs.filter((log: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const actorName = log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.toLowerCase() : '';
    const email = (log.user?.email || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    return actorName.includes(term) || email.includes(term) || action.includes(term);
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Role', 'Action', 'Entity', 'Status', 'IP Address'];
    const rows = filteredLogs.map((l: any) => [
      l.createdAt,
      l.user ? `${l.user.firstName} ${l.user.lastName || ''}`.trim() : 'System',
      l.user?.email || '',
      l.user?.role || '',
      l.action,
      l.entityType,
      'Success',
      l.ipAddress || '::1',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: any[]) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Security & Compliance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Platform Audit Trail & Security Logs
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically tracked administrative events, authentication actions, and operational state changes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh audit logs"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by actor name, email, or action..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                  <option value="USER_APPROVED">USER_APPROVED</option>
                  <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
                  <option value="COURSE_PUBLISHED">COURSE_PUBLISHED</option>
                  <option value="CERTIFICATE_ADDED">CERTIFICATE_ADDED</option>
                </select>

                <select
                  value={selectedEntity}
                  onChange={(e) => {
                    setSelectedEntity(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Entities</option>
                  <option value="User">User</option>
                  <option value="Course">Course</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Assessment">Assessment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">IP / Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        Retrieving platform audit logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        No audit events match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log: any) => {
                      const actorInitials = log.user
                        ? `${log.user.firstName?.[0] || ''}${log.user.lastName?.[0] || ''}`.toUpperCase()
                        : 'SY';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {actorInitials || 'A'}
                              </div>
                              <div className="truncate max-w-[180px]">
                                <span className="font-bold text-slate-900 block truncate">
                                  {log.user ? `${log.user.firstName} ${log.user.lastName || ''}`.trim() : 'System'}
                                </span>
                                {log.user?.email && (
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {log.user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-600 font-medium">{log.entityType}</span>
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status="APPROVED" size="sm" />
                          </td>

                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {log.ipAddress || '::1'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-600">
            <span>
              Page <strong className="text-slate-900">{meta.page}</strong> of{' '}
              <strong className="text-slate-900">{meta.totalPages}</strong> ({meta.total} total audit logs)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages || isLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
