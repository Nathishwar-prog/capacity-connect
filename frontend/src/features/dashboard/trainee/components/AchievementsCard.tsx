'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Trophy, Award, Medal, BadgeCheck, ArrowRight } from 'lucide-react';

interface AchievementItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  awardedAt: string;
}

interface AchievementsCardProps {
  achievements: AchievementItem[];
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({ achievements }) => {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'COURSE_COMPLETION':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'ASSESSMENT_EXCELLENCE':
        return <Award className="w-4 h-4 text-indigo-500" />;
      case 'SKILL_MASTERY':
        return <BadgeCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Medal className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Earned Achievements</span>
          </CardTitle>
          <span className="text-[10px] font-bold text-slate-500">{achievements.length} Badges</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Certified milestones and operational competency achievements
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {achievements.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Complete your first course or assessment to unlock certified badges.
          </div>
        ) : (
          achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getAchievementIcon(ach.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold text-slate-900 truncate">{ach.title}</h5>
                {ach.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {ach.description}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">
                  Awarded {new Date(ach.awardedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainee/achievements">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>View All Achievements</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsCard;
