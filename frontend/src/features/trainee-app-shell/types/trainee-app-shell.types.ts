import React from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  isExternal?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export type NotificationCategory =
  | 'training'
  | 'assessment'
  | 'certificate'
  | 'announcement'
  | 'system';

export interface TraineeNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
  actionUrl?: string;
}

export interface TraineeUserProfile {
  name: string;
  email: string;
  role: string;
  designation?: string;
  department?: string;
  organization?: string;
  avatarUrl?: string;
}

export interface TraineeAppShellProps {
  children: React.ReactNode;
}
