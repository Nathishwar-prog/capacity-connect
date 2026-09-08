'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, TrendingUp, Bell, User } from 'lucide-react';

interface MobileNavigationProps {
  unreadNotificationsCount?: number;
}

const PRIMARY_MOBILE_TABS = [
  {
    href: '/trainee/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/trainee/courses',
    label: 'Courses',
    icon: BookOpen,
  },
  {
    href: '/trainee/progress',
    label: 'Progress',
    icon: TrendingUp,
  },
  {
    href: '/trainee/notifications',
    label: 'Alerts',
    icon: Bell,
    hasBadge: true,
  },
  {
    href: '/trainee/profile',
    label: 'Profile',
    icon: User,
  },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  unreadNotificationsCount = 2,
}) => {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === '/trainee/dashboard') {
      return pathname === '/trainee/dashboard' || pathname === '/dashboard/trainee';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 shadow-lg pb-safe select-none"
    >
      <div className="flex items-center justify-around">
        {PRIMARY_MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all relative ${
                active ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? 'scale-110 text-slate-900' : 'text-slate-500'
                  }`}
                />
                {tab.hasBadge && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${active ? 'font-black' : 'font-medium'}`}
              >
                {tab.label}
              </span>
              {active && <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
