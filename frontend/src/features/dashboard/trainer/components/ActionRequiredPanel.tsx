'use client';

import React from 'react';
import Link from 'next/link';
import { TriangleAlert, CheckCircle2, ArrowRight, Clock3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface ActionItem {
  id: string;
  priority?: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  link: string;
  actionLabel?: string;
}

interface ActionRequiredPanelProps {
  items: ActionItem[];
}

export const ActionRequiredPanel: React.FC<ActionRequiredPanelProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">You&apos;re All Caught Up</h3>
            <p className="text-[11px] text-slate-500">
              No immediate trainee interventions or draft submissions require your action.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
          Optimal Operations
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
            Action Required
          </h3>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
            {items.length} Pending
          </span>
        </div>
        <span className="text-[11px] text-amber-800 font-medium hidden sm:inline">
          High-priority items requiring instructional intervention
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => {
          const isCritical = item.priority === 'CRITICAL';
          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-white border border-amber-200/80 flex flex-col justify-between gap-3 shadow-2xs hover:border-amber-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <Badge
                    variant={isCritical ? 'destructive' : 'warning'}
                    className="text-[9px] uppercase font-extrabold tracking-wider"
                  >
                    {item.priority || 'WARNING'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{item.message}</p>
              </div>

              <div className="flex justify-end pt-1">
                <Link href={item.link}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-800"
                  >
                    <span>{item.actionLabel || 'Resolve'}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionRequiredPanel;
