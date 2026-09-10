import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Building2,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Award,
  Shield,
  Activity,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import { Button } from './Button';

export interface UserDrawerData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string | null;
  designation?: string | null;
  joinedAt?: string;
  lastActive?: string;
  coursesEnrolled?: number;
  coursesCompleted?: number;
  coursesInProgress?: number;
  competencyScore?: number;
  recentActivity?: Array<{
    action: string;
    target: string;
    time: string;
  }>;
}

interface UserDrawerProps {
  user: UserDrawerData | null;
  isOpen: boolean;
  onClose: () => void;
  onChangeRole?: (userId: string, currentRole: string) => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({
  user,
  isOpen,
  onClose,
  onChangeRole,
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="User Profile Details"
          className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Institutional Dossier</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Identity Banner */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-lg shrink-0">
                {initials || 'U'}
              </div>
              <div className="space-y-1 truncate">
                <h3 className="text-base font-extrabold text-slate-900 truncate">{user.name}</h3>
                <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  <RoleBadge role={user.role} size="sm" />
                  <StatusBadge status={user.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Institutional Information */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Institution / Dept:
                </span>
                <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                  {user.department || 'Observational Meteorology'}
                </span>
              </div>

              {user.designation && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Designation:
                  </span>
                  <span className="font-bold text-slate-900">{user.designation}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined:
                </span>
                <span className="font-bold text-slate-900">
                  {user.joinedAt
                    ? new Date(user.joinedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Sep 08, 2026'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last Active:
                </span>
                <span className="font-bold text-slate-900">{user.lastActive || 'Today, 07:12 AM'}</span>
              </div>
            </div>

            {/* Training Overview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Training & Competency Overview
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Curriculum Courses
                  </span>
                  <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>{user.coursesEnrolled ?? 6}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {user.coursesCompleted ?? 3} completed • {user.coursesInProgress ?? 2} in progress
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Competency Score
                  </span>
                  <div className="text-xl font-black text-emerald-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>{user.competencyScore ?? 74}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Target baseline: 70%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Activity
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
                {(user.recentActivity && user.recentActivity.length > 0) ? (
                  user.recentActivity.map((act, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{act.action}</span>
                        <p className="text-[11px] text-slate-500">{act.target}</p>
                        <span className="text-[10px] text-slate-400 block">{act.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <span className="font-bold text-slate-900 block">
                          Completed competency assessment
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Radar Meteorology & DWR Operations
                        </p>
                        <span className="text-[10px] text-slate-400 block">Today, 07:12 AM</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <span className="font-bold text-slate-900 block">Portal sign in</span>
                        <p className="text-[11px] text-slate-500">Secure SSO Session Established</p>
                        <span className="text-[10px] text-slate-400 block">Today, 06:58 AM</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
            {onChangeRole && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeRole(user.id, user.role)}
                className="text-xs"
              >
                Change Role
              </Button>
            )}
            <Link
              href={`/profile?userId=${user.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 ml-auto"
            >
              <span>View full profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserDrawer;
