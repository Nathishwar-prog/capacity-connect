'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  BookOpen,
  Bell,
  Brain,
  Shield,
  Globe,
  Cpu,
  Server,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData, SystemHealthData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AdminSettingsOverviewPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [sData, hData] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getHealthStatus(),
      ]);
      setSettings(sData);
      setHealth(hData);
    } catch {
      showToast('Failed to load system settings and diagnostics.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const CATEGORY_CARDS = [
    {
      title: 'Portal Settings',
      description: 'Manage institutional branding, logos, theme preferences, support contacts, and portal maintenance mode.',
      href: '/admin/settings/portal',
      icon: Building2,
      badge: settings?.portalStatus === 'MAINTENANCE' ? 'Maintenance Active' : 'Active',
      badgeColor: settings?.portalStatus === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Learning Settings',
      description: 'Course publishing workflows, self-enrollment controls, 80% completion criteria, and 7-factor revision engine parameters.',
      href: '/admin/settings/learning',
      icon: BookOpen,
      badge: `${settings?.completionPercentage || 80}% Completion Threshold`,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      title: 'Notification Settings',
      description: 'Automated broadcast rules, announcement distribution, course status alerts, and in-app message life-cycle.',
      href: '/admin/settings/notifications',
      icon: Bell,
      badge: settings?.enableAnnouncementNotifications ? 'Broadcasting Enabled' : 'Muted',
      badgeColor: settings?.enableAnnouncementNotifications ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800',
    },
    {
      title: 'AI & Analytics',
      description: 'Gemini model parameters, AI skill gap analyzers, natural language queries, and strict privacy guards.',
      href: '/admin/settings/ai',
      icon: Brain,
      badge: settings?.enableAiFeatures ? 'AI Engine Online' : 'AI Offline',
      badgeColor: settings?.enableAiFeatures ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800',
    },
    {
      title: 'Security & Access',
      description: 'JWT token lifespans, session timeouts, strong password policies, and role permission mappings.',
      href: '/admin/settings/security',
      icon: Shield,
      badge: `${settings?.sessionTimeoutMinutes || 30}m Timeout`,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Localization',
      description: 'Timezone configuration (Asia/Kolkata), standard date formatting, and official translation dialects (EN, HI, TA).',
      href: '/admin/settings/localization',
      icon: Globe,
      badge: settings?.defaultTimezone || 'Asia/Kolkata',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      title: 'Integrations',
      description: 'Connection status and real-time connectivity testing across PostgreSQL, AI providers, and local file storage.',
      href: '/admin/settings/integrations',
      icon: Cpu,
      badge: health?.status === 'healthy' ? 'All Services Up' : 'Attention Required',
      badgeColor: health?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      title: 'System & Maintenance',
      description: 'Live performance metrics, memory usage, background job health, and application cache invalidation.',
      href: '/admin/settings/system',
      icon: Server,
      badge: `v${health?.version || '1.0.0'}`,
      badgeColor: 'bg-slate-100 text-slate-800',
    },
  ];

  return (
    <SettingsLayout
      title="System Settings"
      description="Configure and manage Capacity Connect platform-wide settings, policies, learning behavior, and integrations."
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Real-time System Status Row */}
        <Card className="border-slate-200/90 shadow-2xs overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Real-Time Platform Operational Health</span>
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-[11px] font-bold text-slate-700 cursor-pointer h-7 px-2.5"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Database */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Database</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${health?.services.database.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-extrabold text-slate-900">
                  {health?.services.database.status === 'UP' ? 'Operational' : 'Degraded'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {health?.services.database.latencyMs || 0}ms latency
              </span>
            </div>

            {/* Portal */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Portal Status</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${settings?.portalStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-extrabold text-slate-900">
                  {settings?.portalStatus || 'ACTIVE'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                {settings?.portalName || 'Capacity Connect'}
              </span>
            </div>

            {/* Learning System */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Learning Engine</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-extrabold text-slate-900">Operational</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Approval Required
              </span>
            </div>

            {/* AI Services */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">AI Assistant</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${settings?.enableAiFeatures ? 'bg-purple-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-extrabold text-slate-900">
                  {settings?.enableAiFeatures ? 'Active' : 'Disabled'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                {settings?.aiModel || 'gemini-1.5-pro'}
              </span>
            </div>

            {/* Storage */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Storage</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-extrabold text-slate-900">Healthy</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Local / Uploads
              </span>
            </div>

            {/* Cache */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Cache</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-extrabold text-slate-900">Operational</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                L1 App Cache
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Controls Section */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-indigo-950">Quick Governance Controls:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/admin/settings/portal"
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Portal Status:</span>
              <span className="text-emerald-700 font-extrabold">● {settings?.portalStatus}</span>
            </Link>

            <Link
              href="/admin/settings/ai"
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>AI Assistant:</span>
              <span className={settings?.enableAiFeatures ? 'text-purple-700 font-extrabold' : 'text-slate-500'}>
                {settings?.enableAiFeatures ? '● Enabled' : '○ Disabled'}
              </span>
            </Link>

            <Link
              href="/admin/settings/notifications"
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Notifications:</span>
              <span className={settings?.enableInAppNotifications ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
                {settings?.enableInAppNotifications ? '● Enabled' : '○ Muted'}
              </span>
            </Link>

            <Link
              href="/admin/settings/learning"
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Course Approval:</span>
              <span className="text-indigo-700 font-extrabold">
                {settings?.requireCourseApproval ? '● Required' : '○ Open'}
              </span>
            </Link>

            <Link
              href="/admin/settings/audit-logs"
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Audit History</span>
            </Link>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CATEGORY_CARDS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${cat.badgeColor}`}
                    >
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600 group-hover:text-indigo-600">
                  <span>Configure Settings</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </SettingsLayout>
  );
}
