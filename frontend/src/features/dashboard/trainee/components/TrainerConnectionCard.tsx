'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Users, User, ArrowRight, Mail } from 'lucide-react';

interface TrainerConnectionProps {
  trainer: {
    id: string;
    name: string;
    designation: string;
    bio: string;
  } | null;
}

export const TrainerConnectionCard: React.FC<TrainerConnectionProps> = ({ trainer }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Assigned Instructor</span>
          </CardTitle>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Active Mentor
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Senior scientist supervising your meteorological training path
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!trainer ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No dedicated instructor assigned yet. Trainer matching will occur upon course enrollment.
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-200 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
                {trainer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {trainer.name}
                </h4>
                <p className="text-[11px] text-indigo-700 font-semibold truncate">
                  {trainer.designation}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
              &ldquo;{trainer.bio}&rdquo;
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                IMD Senior Faculty
              </span>
              <Link href="/trainee/trainers">
                <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 p-1 h-auto">
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainerConnectionCard;
