import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from './card';

interface StatCardProps {
  label: string;
  value: number | string;
  helperText: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  badgeColor?: 'indigo' | 'emerald' | 'sky' | 'amber' | 'purple';
}

const colorMap = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-700 border-purple-100',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  helperText,
  icon: Icon,
  trend,
  badgeColor = 'indigo',
}) => {
  const currentStyle = colorMap[badgeColor] || colorMap.indigo;

  return (
    <Card className="hover:border-slate-300/80 transition-all hover:shadow-xs group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${currentStyle.iconBg}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
          <p className="text-xs text-slate-500 font-medium">{helperText}</p>
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <span
              className={`inline-flex items-center font-bold gap-0.5 ${
                trend.direction === 'up'
                  ? 'text-emerald-700'
                  : trend.direction === 'down'
                    ? 'text-rose-700'
                    : 'text-slate-600'
              }`}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{trend.value}</span>
            </span>
            <span className="text-slate-400 font-medium">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
