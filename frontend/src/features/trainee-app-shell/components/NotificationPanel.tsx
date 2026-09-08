'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Calendar,
  ClipboardList,
  Award,
  Radio,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TraineeNotification } from '../types/trainee-app-shell.types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TraineeNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryIcon = (category: TraineeNotification['category']) => {
    switch (category) {
      case 'training':
        return <Calendar className="w-4 h-4 text-sky-600" />;
      case 'assessment':
        return <ClipboardList className="w-4 h-4 text-indigo-600" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'announcement':
        return <Radio className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Trainee Notifications"
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-50 text-indigo-700">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-xs font-extrabold text-slate-900 tracking-tight">
            Notifications
          </span>
          {unreadCount > 0 ? (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white">
              {unreadCount} unread
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400">All caught up</span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">No notifications yet</p>
            <p className="text-[11px] text-slate-400">
              When instructors or the training division assign modules, they will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                !n.read ? 'bg-sky-50/40 hover:bg-sky-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getCategoryIcon(n.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs leading-tight truncate ${
                      !n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                    }`}
                  >
                    {n.title}
                  </span>
                  {!n.read && (
                    <span
                      className="w-2 h-2 rounded-full bg-sky-600 shrink-0"
                      title="Unread notification"
                    />
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {n.message}
                </p>

                <div className="flex items-center justify-between mt-1.5 pt-1">
                  <span className="text-[10px] font-medium text-slate-400">{n.timestamp}</span>

                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <Link
          href="/trainee/notifications"
          onClick={onClose}
          className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors inline-block w-full py-1"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;
