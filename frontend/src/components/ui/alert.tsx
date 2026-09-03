import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-50 border-slate-200 text-slate-800',
      destructive: 'bg-rose-50 border-rose-200/80 text-rose-800',
      success: 'bg-emerald-50 border-emerald-200/80 text-emerald-800',
      warning: 'bg-amber-50 border-amber-200/80 text-amber-900',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-2xl border p-4 text-xs font-medium flex items-start gap-3 animate-in fade-in duration-200',
          variants[variant],
          className,
        )}
        {...props}
      >
        {variant === 'destructive' && (
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
        )}
        {variant === 'success' && (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
        )}
        {variant === 'warning' && (
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        )}
        {variant === 'default' && <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />}
        <div className="flex-1 space-y-0.5">{children}</div>
      </div>
    );
  },
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('font-bold leading-none tracking-tight text-slate-900', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs opacity-90 leading-relaxed mt-0.5', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';
