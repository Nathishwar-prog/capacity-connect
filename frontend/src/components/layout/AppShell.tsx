'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Users, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import useAuthStore from '@/store/auth';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-full min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/30 flex flex-col">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-900">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          <span className="font-bold font-sans tracking-wide text-indigo-100">
            Capacity Connect
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </Link>

          <Link
            href="/users"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/users')
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users Directory</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/profile')
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </Link>
        </nav>

        {/* User profile brief & logout footer */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/20">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {user?.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-semibold text-slate-300 truncate">
                    {user?.firstName
                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                      : 'Active Member'}
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 text-xs font-semibold rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <span>Sign In Console</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content Top Bar */}
        <header className="h-16 border-b border-slate-900 flex items-center px-8 justify-between bg-slate-950/40">
          <div className="text-sm font-semibold text-slate-300">
            {isActive('/') && 'Dashboard Overview'}
            {isActive('/users') && 'User Management'}
            {isActive('/profile') && 'User Profile'}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Environment:{' '}
            <span className="text-indigo-400">{process.env.NODE_ENV || 'development'}</span>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;
