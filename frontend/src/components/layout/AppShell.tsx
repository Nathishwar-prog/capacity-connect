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
  BookOpenCheck,
  GraduationCap,
  ClipboardList,
  BarChart3,
  MessageSquareQuote,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Sparkle,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useLogout } from '@/features/auth';
import { TraineeOnboardingModal } from '@/features/auth';
import { ROLE_METADATA, CanonicalRole } from '@/constants/roles';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavGroup {
  title?: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const pathname = usePathname();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const isActive = (path: string) => {
    if (path === '/dashboard/trainer' && (pathname === '/dashboard/trainer' || pathname === '/trainer/dashboard')) {
      return true;
    }
    return pathname === path || (path !== '/' && pathname.startsWith(path));
  };

  const userRole = user?.role as CanonicalRole | undefined;
  const roleMeta = (userRole && ROLE_METADATA[userRole]) || {
    title: 'Portal Member',
    badgeLabel: userRole || 'Member',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
    dashboardRoute: '/login',
  };

  // Build dynamic navigation groups based on role
  const getNavGroups = (): NavGroup[] => {
    if (userRole === 'TRAINER') {
      return [
        {
          title: 'Overview',
          items: [
            {
              href: '/dashboard/trainer',
              label: 'Dashboard',
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: 'Learning',
          items: [
            {
              href: '/trainer/courses',
              label: 'My Courses',
              icon: BookOpenCheck,
            },
            {
              href: '/trainer/assessments',
              label: 'Assessments',
              icon: ClipboardList,
            },
          ],
        },
        {
          title: 'People',
          items: [
            {
              href: '/trainer/trainees',
              label: 'Trainees Monitoring',
              icon: GraduationCap,
            },
          ],
        },
        {
          title: 'Insights',
          items: [
            {
              href: '/trainer/analytics',
              label: 'Analytics',
              icon: BarChart3,
            },
            {
              href: '/trainer/feedback',
              label: 'Trainee Feedback',
              icon: MessageSquareQuote,
            },
          ],
        },
        {
          title: 'Account',
          items: [
            {
              href: '/trainer/profile',
              label: 'My Profile',
              icon: User,
            },
          ],
        },
      ];
    }

    if (userRole === 'TRAINEE') {
      return [
        {
          title: 'Learning',
          items: [
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
          ],
        },
      ];
    }

    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return [
        {
          title: 'Governance',
          items: [
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
          ],
        },
      ];
    }

    return [
      {
        items: [
          {
            href: '/profile',
            label: 'Profile Settings',
            icon: User,
          },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  // Compute breadcrumb title from pathname
  const getBreadcrumb = () => {
    if (pathname.includes('/trainer/courses')) return 'Courses Portfolio';
    if (pathname.includes('/trainer/trainees')) return 'Trainee Monitoring';
    if (pathname.includes('/trainer/assessments')) return 'Assessments & Quizzes';
    if (pathname.includes('/trainer/analytics')) return 'Instructional Analytics';
    if (pathname.includes('/trainer/feedback')) return 'Participant Feedback';
    if (pathname.includes('/trainer/profile')) return 'Trainer Profile';
    return 'Training Command Center';
  };

  return (
    <div className="flex h-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white flex flex-col shadow-xs transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
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

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge Bar */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Workspace</span>
          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${roleMeta.badgeClass}`}
          >
            {roleMeta.badgeLabel}
          </span>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.title && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
              )}
              {group.items.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
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
            </div>
          ))}

          {/* Trainee Onboarding Quick Action */}
          {userRole === 'TRAINEE' && (
            <div className="pt-4 border-t border-slate-100">
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
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {user?.firstName
                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                      : 'Active Member'}
                  </span>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Content Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-4 sm:px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="text-slate-400 font-medium">Trainer</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-900">{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Command Search Trigger UI */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs cursor-pointer hover:border-slate-300 transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span>Search curricula, trainees...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                ⌘K
              </kbd>
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-lg p-3 z-50 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-semibold text-indigo-600">All caught up</span>
                  </div>
                  <div className="p-3 text-center text-xs text-slate-500">
                    No unread notifications at this time.
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Ministry Tag */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <CloudSun className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>MoES • IMD</span>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</div>
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
