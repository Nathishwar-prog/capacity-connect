import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  name?: string | null;
  userRole?: string | null;
}

export function Avatar({ className, name, ...props }: AvatarProps) {
  const initial = name && name.trim() ? name.trim()[0].toUpperCase() : 'U';

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs shadow-2xs',
        className,
      )}
      {...props}
    >
      <span>{initial}</span>
    </div>
  );
}

export default Avatar;
