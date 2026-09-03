import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700',
    secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80',
    destructive: 'border-transparent bg-rose-50 border-rose-200 text-rose-700',
    outline: 'text-slate-700 border-slate-200 bg-white',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors uppercase',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export default Badge;
