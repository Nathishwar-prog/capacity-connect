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
  Megaphone,
  Clock,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useLogout } from '@/features/auth';
import { TraineeOnboardingModal } from '@/features/auth';
import { ROLE_METADATA, CanonicalRole } from '@/constants/roles';
import { GlobalSearchModal } from '@/components/ui/GlobalSearchModal';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { AppNotification } from '@/features/notifications/api/notificationApi';
import { FloatingAiAssistant } from '@/components/analytics/FloatingAiAssistant';

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
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const { notifications, unreadCount, markAsRead, isMarkingAsRead, markAllAsRead } = useNotifications();

  const getRelativeTimeString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

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
    if (path === '/admin/capacity-building' && pathname === '/admin/capacity-building') return true;
    if (path === '/admin/capacity-building' && pathname !== '/admin/capacity-building') return false;
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
              label: 'Dashboard',
              icon: LayoutDashboard,
            },
            {
              href: '/admin/announcements',
              label: 'Announcements',
              icon: Megaphone,
            },
            {
              href: '/users',
              label: 'User Directory',
              icon: Users,
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
              href: '/admin/capacity-building',
              label: 'Program Overview',
              icon: BarChart3,
            },
            {
              href: '/admin/capacity-building/trainees',
              label: 'Trainees',
              icon: UserCheck,
            },
            {
              href: '/admin/capacity-building/trainers',
              label: 'Trainers',
              icon: GraduationCap,
            },
            {
              href: '/admin/capacity-building/learning-resources',
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
      if (pathname === '/admin/capacity-building') {
        return { root: 'Capacity Building', current: 'Program Overview & Health' };
      }
      if (pathname.startsWith('/admin/capacity-building/trainees') || pathname.startsWith('/admin/trainees')) {
        return { root: 'Capacity Building', current: 'Trainees Directory & Progress' };
      }
      if (pathname.startsWith('/admin/capacity-building/trainers') || pathname.startsWith('/admin/trainers')) {
        return { root: 'Capacity Building', current: 'Trainers & Faculty Workload' };
      }
      if (pathname.startsWith('/admin/capacity-building/learning-resources') || pathname.startsWith('/admin/resources')) {
        return { root: 'Capacity Building', current: 'Learning Resources & Assets' };
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
    <div className="h-screen w-full overflow-hidden flex bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Fixed Sidebar Navigation with Independent Internal Scrolling */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 border-r border-slate-200 bg-white flex flex-col shadow-xs transition-all duration-200 h-screen ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
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
                href="/trainee/onboarding"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer block"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Role Onboarding</span>
                  </div>
                  <span className="text-[10px] text-indigo-600/80 block mt-0.5 font-medium">
                    Profile, Skills & Diagnostic
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                  Wizard
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

      {/* Main Content Area — Offset for fixed sidebar and takes full viewport height */}
      <main
        className={`flex-1 flex flex-col h-screen min-w-0 overflow-hidden transition-all duration-200 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Fixed Top Bar (Pinned to top of main workspace, never scrolls away) */}
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center px-4 sm:px-8 justify-between shrink-0 z-20">
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
                {unreadCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5 ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2.5 w-[380px] max-w-[calc(100vw-24px)] rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 tracking-tight">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/60 whitespace-nowrap">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAsRead()}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer whitespace-nowrap transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Scrollable Notification List */}
                    <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center text-slate-400 space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Bell className="w-5 h-5 opacity-40" />
                          </div>
                          <p className="text-xs font-medium text-slate-600">No notifications yet</p>
                          <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                            Announcements and portal updates will appear here when dispatched.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setActiveNotification(n);
                              setNotificationsOpen(false);
                            }}
                            className={`p-3.5 rounded-xl transition-all space-y-1.5 cursor-pointer border text-left ${
                              !n.isRead
                                ? 'bg-indigo-50/40 border-indigo-100/90 hover:bg-indigo-50/70 shadow-2xs'
                                : 'bg-white border-slate-100/90 hover:bg-slate-50 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {!n.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                                )}
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    n.type === 'ANNOUNCEMENT'
                                      ? 'bg-purple-100 text-purple-700'
                                      : n.type === 'COURSE'
                                        ? 'bg-sky-100 text-sky-700'
                                        : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {n.type}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                {getRelativeTimeString(n.createdAt)}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
                      <Link
                        href={isAdmin ? '/admin/announcements' : '/dashboard/trainee'}
                        onClick={() => setNotificationsOpen(false)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>{isAdmin ? 'Manage Announcements' : 'View Activity Dashboard'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </>
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

        {/* Scrollable Workspace — Independently scrolls without moving header or sidebar */}
        <div id="admin-main-scroll" className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 focus:outline-none">
          {children}
        </div>
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

      {/* Notification Details Modal */}
      {activeNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                    activeNotification.type === 'ANNOUNCEMENT'
                      ? 'bg-purple-100 text-purple-700'
                      : activeNotification.type === 'COURSE'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeNotification.type}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {getRelativeTimeString(activeNotification.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {activeNotification.title}
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(activeNotification.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto font-medium">
              {activeNotification.message}
            </div>

            {/* Footer with Mark as Read (Database Deletion) & Close */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                disabled={isMarkingAsRead}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await markAsRead(activeNotification.id);
                    setActiveNotification(null);
                  } catch {
                    // handled by query
                  }
                }}
                disabled={isMarkingAsRead}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                {isMarkingAsRead ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Marking as read...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Read</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant for Administrative Users */}
      {isAdmin && <FloatingAiAssistant />}
    </div>
  );
};

export default AppShell;
