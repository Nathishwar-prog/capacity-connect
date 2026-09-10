import React from 'react';

export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'TRAINEE' | string;

interface RoleBadgeProps {
  role: RoleType;
  size?: 'sm' | 'md';
  className?: string;
}

const roleConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  ADMIN: {
    label: 'Administrator',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  TRAINER: {
    label: 'Trainer',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  TRAINEE: {
    label: 'Trainee',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', className = '' }) => {
  const normalizedRole = (role || '').toUpperCase().trim();
  const config = roleConfig[normalizedRole] || {
    label: role || 'Member',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 tracking-wide font-bold uppercase'
      : 'text-xs px-2.5 py-0.5 font-bold tracking-wide uppercase';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default RoleBadge;
