'use client';

import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

interface KeyTakeawaysCardProps {
  takeaways: string[];
}

export const KeyTakeawaysCard = React.memo(function KeyTakeawaysCard({
  takeaways,
}: KeyTakeawaysCardProps) {
  if (!takeaways || takeaways.length === 0) return null;

  const cleanedTakeaways = takeaways.map((item) =>
    item.replace(/^✓\s*/, '').replace(/^•\s*/, '').trim()
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900/60 border border-emerald-900/50 space-y-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-300">
        <div className="w-6 h-6 rounded-lg bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Key Takeaways
        </h3>
      </div>

      <ul className="space-y-2.5 pt-1">
        {cleanedTakeaways.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-emerald-100 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
