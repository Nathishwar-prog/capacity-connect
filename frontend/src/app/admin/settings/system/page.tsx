'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { DangerousConfirmModal } from '@/features/settings/components/DangerousConfirmModal';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemHealthData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Server, Trash2, Cpu, Activity, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

const BACKGROUND_JOBS = [
  { name: 'Announcement Notification Processor', status: 'Running', frequency: 'Event-driven', lastRun: 'Just now' },
  { name: 'Adaptive Revision Prioritization Engine', status: 'Healthy', frequency: 'On-Demand / Scheduled', lastRun: '5 minutes ago' },
  { name: 'Skill Gap Diagnostic Aggregator', status: 'Healthy', frequency: 'Post-Assessment Event', lastRun: '12 minutes ago' },
  { name: 'Executive Analytics Cache Refresh', status: 'Idle', frequency: 'Every 30 minutes', lastRun: '18 minutes ago' },
];

export default function SystemMaintenanceSettingsPage() {
  const { showToast } = useToast();
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  const loadHealth = async () => {
    try {
      const data = await settingsApi.getHealthStatus();
      setHealth(data);
    } catch {
      showToast('Failed to retrieve system diagnostics.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleClearCacheConfirm = async () => {
    setIsClearingCache(true);
    try {
      const res = await settingsApi.clearCache();
      showToast(`Platform cache cleared successfully. (${res.itemsEvicted} items evicted)`, 'success');
      setShowClearCacheModal(false);
      loadHealth();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear cache.', 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <SettingsLayout
      title="System Maintenance & Platform Diagnostics"
      description="Inspect real-time runtime diagnostics, background task runners, and manage application cache memory."
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Runtime Diagnostics Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Platform Runtime & Performance Diagnostics</span>
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadHealth}
              className="text-[11px] font-bold text-slate-700 cursor-pointer h-7 px-2.5"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh Metrics
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-500 block">Version & Environment</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-1">
                v{health?.version || '1.0.0'} ({health?.environment || 'development'})
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Next.js 14 & Node.js 20</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-500 block">Server Uptime</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-1">
                {health?.uptimeSeconds ? formatUptime(health.uptimeSeconds) : '0s'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Continuous Process</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-500 block">Heap Memory (Used / Total)</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-1">
                {health?.memoryUsage?.heapUsed ? formatBytes(health.memoryUsage.heapUsed) : '0 MB'} /{' '}
                {health?.memoryUsage?.heapTotal ? formatBytes(health.memoryUsage.heapTotal) : '0 MB'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                RSS: {health?.memoryUsage?.rss ? formatBytes(health.memoryUsage.rss) : '0 MB'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-500 block">Database Query Latency</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-1">
                {health?.services?.database?.latencyMs || 0} ms
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                Status: {health?.services?.database?.status || 'UP'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cache Invalidation Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-indigo-600" />
              <span>Platform Cache Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Application Cache Memory</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Evicting in-memory catalog, analytics, and session memoizations will force clean database queries.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowClearCacheModal(true)}
                disabled={isClearingCache}
                className="text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Background Jobs Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Scheduled Platform Jobs & Event Dispatchers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Job Name</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Execution Trigger</th>
                    <th className="py-2.5 px-4">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {BACKGROUND_JOBS.map((job) => (
                    <tr key={job.name} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{job.name}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          ● {job.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{job.frequency}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{job.lastRun}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal for Clearing Cache */}
      <DangerousConfirmModal
        isOpen={showClearCacheModal}
        title="Clear Platform Application Cache?"
        message="This operation will flush all in-memory cache stores. Active users will experience a minor momentary latency spike while database queries repopulate the cache."
        confirmLabel="Clear Cache"
        onConfirm={handleClearCacheConfirm}
        onCancel={() => setShowClearCacheModal(false)}
        isLoading={isClearingCache}
      />
    </SettingsLayout>
  );
}
