'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, CheckCircle2, FileCheck2, BookOpen } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  timestamp: string;
}

interface RecentActivityTimelineProps {
  activities: ActivityItem[];
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({ activities }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Recent Learning Activity</span>
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit timeline of lessons, quiz submissions, and completed milestones
        </p>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No recent activity recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50/50 border border-slate-100"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {act.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{act.entityType}</span>
                    <span>•</span>
                    <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityTimeline;
