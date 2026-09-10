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
  ChevronLeft,
  BookOpen,
  Library,
  Target,
  TrendingUp,
  Trophy,
  MessageSquare,
  Compass,
  Brain,
  Settings,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useLogout } from '@/features/auth';
import { TraineeOnboardingModal } from '@/features/auth';
import { ROLE_METADATA, CanonicalRole } from '@/constants/roles';
import { GlobalSearchModal } from '@/components/ui/GlobalSearchModal';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Restore sidebar collapsed preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cc_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut listener for Global Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (path === '/dashboard/admin' && pathname === '/dashboard/admin') return true;
    if (path === '/dashboard/trainer' && (pathname === '/dashboard/trainer' || pathname === '/trainer/dashboard')) return true;
    if (path === '/dashboard/trainee' && (pathname === '/dashboard/trainee' || pathname === '/trainee/dashboard')) return true;
    if (path === '/users' && pathname.startsWith('/users')) return true;
    if (path === '/trainee/profile' && (pathname === '/trainee/profile' || pathname === '/profile')) return true;
    return pathname === path || (path !== '/' && pathname.startsWith(path));
  };

  const userRole = user?.role as CanonicalRole | undefined;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const roleMeta = (userRole && ROLE_METADATA[userRole]) || {
    title: 'Portal Member',
    badgeLabel: userRole || 'Member',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
    dashboardRoute: '/login',
  };

  // Build dynamic navigation groups based on role
  const getNavGroups = (): NavGroup[] => {
    if (isAdmin) {
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
              label: 'User Directory',
              icon: Users,
            },
            {
              href: '/admin/roles',
              label: 'Roles & Permissions',
              icon: ShieldCheck,
            },
          ],
        },
        {
          title: 'Learning Governance',
          items: [
            {
              href: '/admin/courses',
              label: 'Courses & Curriculum',
              icon: BookOpen,
            },
            {
              href: '/admin/competencies',
              label: 'Competency Models',
              icon: Brain,
            },
            {
              href: '/admin/assessments',
              label: 'Assessments',
              icon: ClipboardList,
            },
          ],
        },
        {
          title: 'Capacity Building',
          items: [
            {
              href: '/admin/trainers',
              label: 'Trainers',
              icon: GraduationCap,
            },
            {
              href: '/admin/trainees',
              label: 'Trainees',
              icon: UserCheck,
            },
            {
              href: '/admin/resources',
              label: 'Learning Resources',
              icon: Library,
            },
          ],
        },
        {
          title: 'Intelligence',
          items: [
            {
              href: '/admin/analytics',
              label: 'Analytics',
              icon: BarChart3,
            },
            {
              href: '/admin/ai-insights',
              label: 'AI Insights',
              icon: Sparkles,
            },
          ],
        },
        {
          title: 'System',
          items: [
            {
              href: '/admin/settings',
              label: 'Settings',
              icon: Settings,
            },
            {
              href: '/admin/audit-logs',
              label: 'Audit Logs',
              icon: Activity,
            },
          ],
        },
      ];
    }

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
          title: 'Overview',
          items: [
            {
              href: '/dashboard/trainee',
              label: 'Dashboard',
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: 'Learning',
          items: [
            {
              href: '/trainee/my-learning',
              label: 'My Learning',
              icon: BookOpen,
            },
            {
              href: '/trainee/revision',
              label: 'Adaptive Revision',
              icon: Sparkles,
            },
            {
              href: '/trainee/courses',
              label: 'Course Catalog',
              icon: Compass,
            },
            {
              href: '/trainee/resources',
              label: 'Learning Resources',
              icon: Library,
            },
            {
              href: '/trainee/assessments',
              label: 'Assessments',
              icon: ClipboardList,
            },
          ],
        },
        {
          title: 'Development',
          items: [
            {
              href: '/trainee/competencies',
              label: 'My Competencies',
              icon: Target,
            },
            {
              href: '/trainee/skill-gaps',
              label: 'Skill Gaps',
              icon: TrendingUp,
            },
            {
              href: '/trainee/recommendations',
              label: 'AI Recommendations',
              icon: Sparkles,
            },
            {
              href: '/trainee/achievements',
              label: 'Achievements',
              icon: Trophy,
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              href: '/trainee/trainers',
              label: 'My Trainers',
              icon: Users,
            },
            {
              href: '/trainee/feedback',
              label: 'Feedback',
              icon: MessageSquare,
            },
            {
              href: '/trainee/assistant',
              label: 'Learning Assistant',
              icon: Sparkles,
            },
          ],
        },
        {
          title: 'Account',
          items: [
            {
              href: '/trainee/profile',
              label: 'My Profile',
              icon: User,
            },
            {
              href: '/trainee/preferences',
              label: 'Learning Preferences',
              icon: Settings,
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

  // Compute breadcrumb context accurately
  const getBreadcrumb = (): { root: string; current: string } => {
    if (isAdmin) {
      if (pathname.includes('/dashboard/admin')) {
        return { root: 'Administrator', current: 'Governance Dashboard' };
      }
      if (pathname.startsWith('/users')) {
        return { root: 'Administration', current: 'User Directory & Access Control' };
      }
      if (pathname.startsWith('/admin/roles')) {
        return { root: 'Governance', current: 'Roles & Permissions' };
      }
      if (pathname.startsWith('/admin/courses')) {
        return { root: 'Learning Governance', current: 'Courses & Curriculum' };
      }
      if (pathname.startsWith('/admin/competencies')) {
        return { root: 'Learning Governance', current: 'Competency Models' };
      }
      if (pathname.startsWith('/admin/assessments')) {
        return { root: 'Learning Governance', current: 'Assessments Oversight' };
      }
      if (pathname.startsWith('/admin/trainers')) {
        return { root: 'Capacity Building', current: 'Domain Trainers Directory' };
      }
      if (pathname.startsWith('/admin/trainees')) {
        return { root: 'Capacity Building', current: 'Capacity Trainees Cohort' };
      }
      if (pathname.startsWith('/admin/resources')) {
        return { root: 'Capacity Building', current: 'Learning Resources' };
      }
      if (pathname.startsWith('/admin/analytics')) {
        return { root: 'Intelligence', current: 'Analytics Command Center' };
      }
      if (pathname.startsWith('/admin/ai-insights')) {
        return { root: 'Intelligence', current: 'AI Insights & Explainability' };
      }
      if (pathname.startsWith('/admin/settings')) {
        return { root: 'System', current: 'Portal Governance Settings' };
      }
      if (pathname.startsWith('/admin/audit-logs')) {
        return { root: 'System', current: 'Security & Audit Logs' };
      }
      if (pathname.startsWith('/profile')) {
        return { root: 'Administrator', current: 'Institutional Profile & Security' };
      }
      return { root: 'Administrator', current: 'Governance Console' };
    }

    if (userRole === 'TRAINER') {
      if (pathname.includes('/trainer/courses')) return { root: 'Trainer', current: 'Courses Portfolio' };
      if (pathname.includes('/trainer/trainees')) return { root: 'Trainer', current: 'Trainee Monitoring' };
      if (pathname.includes('/trainer/assessments')) return { root: 'Trainer', current: 'Assessments & Quizzes' };
      if (pathname.includes('/trainer/analytics')) return { root: 'Trainer', current: 'Instructional Analytics' };
      if (pathname.includes('/trainer/feedback')) return { root: 'Trainer', current: 'Participant Feedback' };
      if (pathname.includes('/trainer/profile')) return { root: 'Trainer', current: 'Trainer Profile' };
      return { root: 'Trainer', current: 'Training Command Center' };
    }

    if (userRole === 'TRAINEE') {
      if (pathname.includes('/trainee/my-learning')) return { root: 'Learner', current: 'My Learning' };
      if (pathname.includes('/trainee/revision')) return { root: 'Learner', current: 'Adaptive Revision' };
      if (pathname.includes('/trainee/courses')) return { root: 'Learner', current: 'Course Catalog' };
      if (pathname.includes('/trainee/resources')) return { root: 'Learner', current: 'Learning Resources' };
      if (pathname.includes('/trainee/assessments')) return { root: 'Learner', current: 'My Assessments' };
      if (pathname.includes('/trainee/competencies')) return { root: 'Learner', current: 'My Competencies' };
      if (pathname.includes('/trainee/skill-gaps')) return { root: 'Learner', current: 'Skill Gaps' };
      if (pathname.includes('/trainee/recommendations')) return { root: 'Learner', current: 'AI Recommendations' };
      if (pathname.includes('/trainee/achievements')) return { root: 'Learner', current: 'Achievements' };
      if (pathname.includes('/trainee/trainers')) return { root: 'Learner', current: 'My Trainers' };
      if (pathname.includes('/trainee/feedback')) return { root: 'Learner', current: 'Training Feedback' };
      if (pathname.includes('/trainee/assistant')) return { root: 'Learner', current: 'Learning Assistant' };
      if (pathname.includes('/trainee/profile') || pathname === '/profile') return { root: 'Learner', current: 'My Profile' };
      if (pathname.includes('/trainee/preferences')) return { root: 'Learner', current: 'Learning Preferences' };
      if (pathname.includes('/trainee/setup')) return { root: 'Learner', current: 'Trainee Capacity Setup' };
      return { root: 'Learner', current: 'Learning Dashboard' };
    }

    return { root: 'Capacity Connect', current: 'Portal' };
  };

  const breadcrumb = getBreadcrumb();

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
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white flex flex-col shadow-xs transition-all duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-18' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between border-b border-slate-100 ${isCollapsed ? 'px-3' : 'px-5'}`}>
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shadow-indigo-600/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold tracking-tight text-slate-900 text-sm leading-tight truncate">
                  Capacity Connect
                </span>
                <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase truncate">
                  MoES / IMD Portal
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge Bar */}
        {!isCollapsed && (
          <div className="px-5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              {isAdmin ? 'ADMINISTRATOR' : 'WORKSPACE'}
            </span>
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${roleMeta.badgeClass}`}
            >
              {roleMeta.badgeLabel}
            </span>
          </div>
        )}

        {/* Grouped Navigation Links */}
        <nav className={`flex-1 py-3 space-y-3 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {!isCollapsed && group.title && (
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
                    title={isCollapsed ? link.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-bold border-r-2 border-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{link.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Trainee Onboarding Quick Action */}
          {userRole === 'TRAINEE' && !isCollapsed && (
            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/trainee/setup"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer block"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trainee Setup</span>
                  </div>
                  <span className="text-[10px] text-indigo-600/80 block mt-0.5 font-medium">
                    Profile & Capacity Onboarding
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                  Setup
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Collapse Toggle (Desktop only) */}
        <div className="hidden lg:flex items-center justify-center p-2 border-t border-slate-100 bg-slate-50/40">
          <button
            type="button"
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User profile brief & logout footer */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50/60 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {isAuthenticated && user ? (
            <>
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                    {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="truncate flex-1">
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName || ''}`.trim()
                        : 'Active Member'}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate font-medium">
                      {user?.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs mb-2 shrink-0"
                  title={user?.email}
                >
                  {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
              )}

              <button
                type="button"
                onClick={() => logout()}
                disabled={isLoggingOut}
                title="Sign Out"
                className={`flex items-center justify-center gap-2 py-1.5 px-2 border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer ${
                  isCollapsed ? 'w-8 h-8 p-0' : 'w-full'
                }`}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              <span>Sign In</span>
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
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs / Page Context */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-medium">{breadcrumb.root}</span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="text-slate-900 font-bold">{breadcrumb.current}</span>
            </nav>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Command Search Trigger UI */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs hover:border-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search curricula, personnel...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
                title="Notifications"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-88 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      3 New
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs max-h-80 overflow-y-auto">
                    <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors space-y-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Approvals
                        </span>
                        <span className="text-[10px] text-slate-400">2m ago</span>
                      </div>
                      <p className="font-bold text-slate-900 text-[11px]">
                        Trainer approval requested
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Dr. E. N. Rajagopal submitted application for NWP domain.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors space-y-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Training
                        </span>
                        <span className="text-[10px] text-slate-400">18m ago</span>
                      </div>
                      <p className="font-bold text-slate-900 text-[11px]">
                        Course submitted for approval
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Operational Weather Forecasting & Synoptic Analysis ready for review.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors space-y-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Competencies
                        </span>
                        <span className="text-[10px] text-slate-400">1h ago</span>
                      </div>
                      <p className="font-bold text-slate-900 text-[11px]">
                        Competency model updated
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Radar Meteorology framework recalibrated with WMO guidelines.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Link
                      href="/admin/audit-logs"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View All Platform Activity →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Ministry Tag */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 font-bold">
              <CloudSun className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>MoES • IMD</span>
            </div>

            {/* Admin Profile Dropdown */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Profile Menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
                  </div>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 space-y-1 text-xs animate-in fade-in duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <span className="font-extrabold text-slate-900 block truncate">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Administrator'}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {user?.email}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Admin Profile</span>
                    </Link>

                    <Link
                      href="/admin/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Portal Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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

      {/* Global Search Command Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export default AppShell;
