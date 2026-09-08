'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  TrendingUp,
  ClipboardList,
  Award,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { NavItem } from '../types/trainee-app-shell.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '@/features/trainee-dashboard/utils/i18n';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
  unreadNotificationsCount?: number;
}

const TRAINEE_NAV_ITEMS: NavItem[] = [
  {
    href: '/trainee/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/trainee/courses',
    label: 'My Courses',
    icon: BookOpen,
  },
  {
    href: '/trainee/explore',
    label: 'Explore Courses',
    icon: Compass,
  },
  {
    href: '/trainee/progress',
    label: 'My Progress',
    icon: TrendingUp,
  },
  {
    href: '/trainee/assessments',
    label: 'Assessments',
    icon: ClipboardList,
  },
  {
    href: '/trainee/certificates',
    label: 'Certificates',
    icon: Award,
  },
  {
    href: '/trainee/notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 2,
    badgeColor: 'bg-rose-500 text-white',
  },
  {
    href: '/trainee/profile',
    label: 'Profile',
    icon: User,
  },
  {
    href: '/trainee/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
  isLoggingOut = false,
  unreadNotificationsCount = 2,
}) => {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  const getNavLabel = (href: string, fallback: string) => {
    switch (href) {
      case '/trainee/dashboard':
        return t.navDashboard;
      case '/trainee/courses':
        return t.navMyCourses;
      case '/trainee/explore':
        return t.navExploreCourses;
      case '/trainee/progress':
        return t.navMyProgress;
      case '/trainee/assessments':
        return t.navAssessments;
      case '/trainee/certificates':
        return t.navCertificates;
      case '/trainee/notifications':
        return t.navNotifications;
      case '/trainee/profile':
        return t.navProfile;
      case '/trainee/settings':
        return t.navSettings;
      default:
        return fallback;
    }
  };

  const isRouteActive = (href: string) => {
    if (href === '/trainee/dashboard') {
      return pathname === '/trainee/dashboard' || pathname === '/dashboard/trainee';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      aria-label="Trainee Main Sidebar"
      className={`h-full flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Portal Branding Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <Link
          href="/trainee/dashboard"
          onClick={onCloseMobile}
          className={`flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none rounded-xl p-1 transition-all ${
            isCollapsed ? 'mx-auto justify-center' : ''
          }`}
          title="IMD Portal - Capacity Connect"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs group-hover:border-sky-300 transition-all shrink-0">
            <CloudSun className="w-5 h-5 text-sky-600" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold tracking-tight text-slate-900 text-sm leading-tight truncate">
                IMD Portal
              </span>
              <span className="text-[11px] font-semibold text-slate-400 leading-tight">
                {t.portalSubtitle}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle (hidden when collapsed to keep header clean; toggle at bottom or header button) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav
        aria-label="Trainee navigation items"
        className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden"
      >
        {TRAINEE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.href);
          const badgeValue =
            item.label === 'Notifications' && unreadNotificationsCount > 0
              ? unreadNotificationsCount
              : item.badge;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={active ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
                active
                  ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                  active ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 tracking-tight">
                  {getNavLabel(item.href, item.label)}
                </span>
              )}

              {/* Unread / Status Badge */}
              {badgeValue !== undefined && !isCollapsed && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white text-slate-900' : 'bg-rose-500 text-white'
                  }`}
                >
                  {badgeValue}
                </span>
              )}

              {/* Dot indicator when collapsed */}
              {badgeValue !== undefined && isCollapsed && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area with Expand button on desktop collapsed & Separated Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1.5 shrink-0">
        {/* Expand toggle when collapsed on desktop */}
        {isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Knowledge center resource link */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-[11px] text-slate-500 flex items-center gap-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{t.helpAndKnowledge}</span>
          </div>
        )}

        {/* Log Out Button */}
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={isCollapsed ? t.signOut : undefined}
          aria-label={t.signOut}
          className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/60 transition-all shadow-2xs disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600 shrink-0" />
          ) : (
            <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600 shrink-0" />
          )}
          {!isCollapsed && <span className="truncate">{t.signOut}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
