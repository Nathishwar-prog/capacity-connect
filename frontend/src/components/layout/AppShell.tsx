'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Loader2,
  CloudSun,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useLogout } from '@/features/auth';
import { TraineeOnboardingModal } from '@/features/auth';
import { ROLE_METADATA, CanonicalRole } from '@/constants/roles';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const pathname = usePathname();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Automatically trigger onboarding modal for Trainees who have not completed profile details
  useEffect(() => {
    if (isAuthenticated && user?.role === 'TRAINEE') {
      const isProfileIncomplete =
        !user.departmentId ||
        !user.traineeProfile?.designation ||
        (user.traineeProfile?.profileCompletion ?? 0) < 80;

      let isDismissed = false;
      try {
        isDismissed = sessionStorage.getItem('trainee_onboarding_dismissed') === 'true';
      } catch {
        // ignore
      }

      if (isProfileIncomplete && !isDismissed) {
        setIsOnboardingOpen(true);
      }
    }
  }, [isAuthenticated, user]);

  const isActive = (path: string) => pathname === path;
  const userRole = user?.role as CanonicalRole | undefined;
  const roleMeta = (userRole && ROLE_METADATA[userRole]) || {
    title: 'Portal Member',
    badgeLabel: userRole || 'Member',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
    dashboardRoute: '/login',
  };

  // Build dynamic navigation links based on user role
  const getNavLinks = () => {
    switch (userRole) {
      case 'TRAINEE':
        return [
          {
            href: '/dashboard/trainee',
            label: 'Learning Dashboard',
            icon: LayoutDashboard,
          },
          {
            href: '/profile',
            label: 'My Competencies & Profile',
            icon: User,
          },
        ];

      case 'TRAINER':
        return [
          {
            href: '/dashboard/trainer',
            label: 'Instruction Dashboard',
            icon: LayoutDashboard,
          },
          {
            href: '/profile',
            label: 'Trainer Profile',
            icon: User,
          },
        ];

      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          {
            href: '/dashboard/admin',
            label: 'Governance Dashboard',
            icon: LayoutDashboard,
          },
          {
            href: '/users',
            label: 'User Directory & RBAC',
            icon: Users,
          },
          {
            href: '/profile',
            label: 'Admin Profile',
            icon: User,
          },
        ];

      default:
        return [
          {
            href: '/profile',
            label: 'Profile Settings',
            icon: User,
          },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shadow-indigo-600/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-slate-900 text-sm leading-tight">
              Capacity Connect
            </span>
            <span className="text-[10px] font-bold text-indigo-700">MoES / IMD Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-5 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs border-r-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Trainee Onboarding Quick Action */}
          {userRole === 'TRAINEE' && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-left hover:border-indigo-300 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trainee Setup</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Skills & Department
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                  Setup
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* User profile brief & logout footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                  {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName || ''}`.trim()
                        : 'Active Member'}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${roleMeta.badgeClass}`}
                    >
                      {roleMeta.badgeLabel}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-500 truncate font-medium">
                    {user?.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              <span>Sign In Console</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-8 justify-between">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-indigo-600" />
            <span>Ministry of Earth Sciences • India Meteorological Department</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Role:</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${roleMeta.badgeClass}`}
            >
              {roleMeta.badgeLabel}
            </span>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>

      {/* Trainee Onboarding Modal */}
      <TraineeOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export default AppShell;
