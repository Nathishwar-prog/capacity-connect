import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'sky';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'indigo',
}) => {
  const variantStyles = {
    indigo: {
      bg: 'bg-indigo-50/80 border-indigo-100',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-600/20',
      text: 'text-indigo-900',
    },
    emerald: {
      bg: 'bg-emerald-50/80 border-emerald-100',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-600/20',
      text: 'text-emerald-900',
    },
    amber: {
      bg: 'bg-amber-50/80 border-amber-100',
      iconBg: 'bg-amber-600 text-white shadow-amber-600/20',
      text: 'text-amber-900',
    },
    purple: {
      bg: 'bg-purple-50/80 border-purple-100',
      iconBg: 'bg-purple-600 text-white shadow-purple-600/20',
      text: 'text-purple-900',
    },
    sky: {
      bg: 'bg-sky-50/80 border-sky-100',
      iconBg: 'bg-sky-600 text-white shadow-sky-600/20',
      text: 'text-sky-900',
    },
  };

  const style = variantStyles[variant];

  return (
    <Card className="hover:border-slate-300/80 transition-all hover:shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">{title}</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{subtitle}</p>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${style.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
