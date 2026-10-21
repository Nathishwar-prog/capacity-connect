'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Save,
  RotateCcw,
  LayoutDashboard,
  AlertCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';

export interface SettingsCategory {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin/settings',
    icon: LayoutDashboard,
    description: 'System dashboard & platform health overview',
  },
  {
    id: 'portal',
    label: 'Portal Settings',
    href: '/admin/settings/portal',
    icon: Building2,
    description: 'Branding, logos, theme, status & contacts',
  },
  {
    id: 'learning',
    label: 'Learning Settings',
    href: '/admin/settings/learning',
    icon: BookOpen,
    description: 'Course lifecycle, completion threshold & revision engine',
  },
  {
    id: 'notifications',
    label: 'Notification Settings',
    href: '/admin/settings/notifications',
    icon: Bell,
    description: 'Announcement, course & learning notifications',
  },
  {
    id: 'ai',
    label: 'AI & Analytics',
    href: '/admin/settings/ai',
    icon: Brain,
    description: 'Feature toggles, model parameters & privacy guards',
  },
  {
    id: 'security',
    label: 'Security & Access',
    href: '/admin/settings/security',
    icon: Shield,
    description: 'Session timeout, password policy & RBAC rules',
  },
  {
    id: 'localization',
    label: 'Localization',
    href: '/admin/settings/localization',
    icon: Globe,
    description: 'Supported languages, timezone & date formats',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    href: '/admin/settings/integrations',
    icon: Cpu,
    description: 'Service connections, database & health check pings',
  },
  {
    id: 'system',
    label: 'System & Maintenance',
    href: '/admin/settings/system',
    icon: Server,
    description: 'Diagnostics, versioning & cache management',
  },
  {
    id: 'audit-logs',
    label: 'Settings Audit Trail',
    href: '/admin/settings/audit-logs',
    icon: Activity,
    description: 'Historical audit log of governance modifications',
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  isDirty?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onReset?: () => void;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  title,
  description,
  isDirty = false,
  isLoading = false,
  isSaving = false,
  onSave,
  onReset,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [pendingTargetHref, setPendingTargetHref] = useState<string | null>(null);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (isDirty && href !== pathname) {
      e.preventDefault();
      setPendingTargetHref(href);
      setShowUnsavedPrompt(true);
    }
  };

  const confirmDiscardAndNavigate = () => {
    setShowUnsavedPrompt(false);
    if (pendingTargetHref) {
      router.push(pendingTargetHref);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Platform Governance</span>
                <span>/</span>
                <span>Settings</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>

            {/* Action Buttons */}
            {onSave && (
              <div className="flex items-center gap-3">
                {onReset && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isDirty || isSaving || isLoading}
                    onClick={onReset}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Discard
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={!isDirty || isSaving || isLoading}
                  onClick={onSave}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* Unsaved Changes Banner */}
          {isDirty && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You have unsaved changes in this category. Click Save Changes to commit them.</span>
              </div>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
                >
                  Save Now
                </button>
              )}
            </div>
          )}

          {/* Mobile Category Dropdown Selector */}
          <div className="lg:hidden">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Settings Category
            </label>
            <select
              value={pathname}
              onChange={(e) => {
                if (isDirty) {
                  setPendingTargetHref(e.target.value);
                  setShowUnsavedPrompt(true);
                } else {
                  router.push(e.target.value);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {SETTINGS_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.href}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Category Navigation */}
            <aside className="hidden lg:block lg:col-span-3 space-y-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs sticky top-20">
              <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Setting Categories
              </div>
              <nav className="space-y-1">
                {SETTINGS_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive =
                    cat.href === '/admin/settings'
                      ? pathname === '/admin/settings'
                      : pathname.startsWith(cat.href);

                  return (
                    <Link
                      key={cat.id}
                      href={cat.href}
                      onClick={(e) => handleNavClick(e, cat.href)}
                      className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50/80 text-indigo-950 font-bold border-l-4 border-indigo-600 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="text-xs block leading-tight truncate">{cat.label}</span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5 font-normal">
                          {cat.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Right Main Content Area */}
            <main className="lg:col-span-9 min-w-0 space-y-6">{children}</main>
          </div>
        </div>

        {/* Unsaved Changes Prompt Modal */}
        {showUnsavedPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">Unsaved Changes</h3>
              <p className="mt-2 text-xs text-slate-600">
                You have modified settings that have not been saved yet. Leaving now will discard your changes.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnsavedPrompt(false)}
                  className="cursor-pointer"
                >
                  Stay
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={confirmDiscardAndNavigate}
                  className="cursor-pointer font-bold"
                >
                  Discard Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
};
