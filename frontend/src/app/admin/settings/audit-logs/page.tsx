'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SettingsAuditLog } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Activity, User, Clock, ArrowRight, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

export default function SettingsAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<SettingsAuditLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getAuditLogs(page, 15);
      setLogs(res.logs);
      setPagination(res.pagination);
    } catch {
      showToast('Failed to load settings audit trail.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <SettingsLayout
      title="Settings Governance Audit Trail"
      description="Immutable historical log recording every configuration mutation, previous versus new values, and administrative actors."
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Configuration Change History</span>
            </CardTitle>
            <span className="text-xs text-slate-500 font-semibold">
              Total Records: {pagination.total}
            </span>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold">No settings modifications recorded yet.</p>
                <p className="text-[11px] text-slate-400">
                  Any future adjustments to portal, learning, or security settings will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Timestamp (IST)</th>
                      <th className="py-2.5 px-4">Administrator</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Modified Attributes (Diff)</th>
                      <th className="py-2.5 px-4">Origin IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {logs.map((log) => {
                      const diffEntries = log.oldValues ? Object.entries(log.oldValues) : [];

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 align-top">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {log.user ? `${log.user.firstName} ${log.user.lastName || ''}`.trim() : 'System'}
                            </div>
                            <span className="text-[10px] text-slate-400 block">{log.user?.email || 'automated'}</span>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase">
                              {log.user?.role || 'SYSTEM'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 whitespace-nowrap">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 space-y-1 max-w-md">
                            {diffEntries.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">System action executed</span>
                            ) : (
                              diffEntries.map(([key, diff]) => (
                                <div
                                  key={key}
                                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono"
                                >
                                  <span className="font-bold text-slate-700">{key}: </span>
                                  <span className="text-rose-600 line-through">
                                    {typeof diff.previous === 'object'
                                      ? JSON.stringify(diff.previous)
                                      : String(diff.previous ?? 'none')}
                                  </span>
                                  <span className="mx-1.5 text-slate-400">→</span>
                                  <span className="text-emerald-700 font-bold">
                                    {typeof diff.current === 'object'
                                      ? JSON.stringify(diff.current)
                                      : String(diff.current ?? 'none')}
                                  </span>
                                </div>
                              ))
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => loadLogs(pagination.page - 1)}
                    className="text-xs cursor-pointer h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadLogs(pagination.page + 1)}
                    className="text-xs cursor-pointer h-8 px-2.5"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
