import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99]';

    const variants = {
      default: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800',
      primary: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800',
      destructive: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700',
      outline:
        'border border-slate-200 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-slate-900',
      secondary: 'bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200/80',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      link: 'text-indigo-600 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-[11px]',
      lg: 'h-12 rounded-2xl px-6 text-sm',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
