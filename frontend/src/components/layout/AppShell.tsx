'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useLogout } from '@/features/auth';
import { TraineeOnboardingModal } from '@/features/auth';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const pathname = usePathname();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const userRole = user?.role;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'TRAINER':
        return {
          label: 'Trainer',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'TRAINEE':
      default:
        return { label: 'Trainee', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
  };

  const badge = getRoleBadge(userRole);

  return (
    <div className="flex h-full min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shadow-sm">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold font-sans tracking-tight text-slate-900 text-base">
            Capacity Connect
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-5 px-3 space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive('/')
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-2 border-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </Link>

          {/* Directory restricted to ADMIN & SUPER_ADMIN */}
          {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
            <Link
              href="/users"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive('/users')
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-2 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users Directory</span>
            </Link>
          )}

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive('/profile')
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-2 border-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </Link>

          {/* Trainee Onboarding Quick Action */}
          {userRole === 'TRAINEE' && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/80 text-left hover:border-indigo-300 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trainee Setup</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Skills & Department
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
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
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-500 truncate font-medium">
                    {user?.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50"
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
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
          <div className="text-sm font-bold text-slate-800">
            {isActive('/') && 'Dashboard Overview'}
            {isActive('/users') && 'User Management'}
            {isActive('/profile') && 'User Profile Settings'}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {user?.organizationId && (
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Capacity Connect Demo Organization</span>
              </div>
            )}
            <div className="font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                {user?.role || 'GUEST'}
              </span>
            </div>
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
