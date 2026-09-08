'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Library,
  PlayCircle,
  FileText,
  ListChecks,
  File,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
}

interface LearningResourcesListProps {
  resources: ResourceItem[];
}

export const LearningResourcesList: React.FC<LearningResourcesListProps> = ({ resources }) => {
  const getResourceIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VIDEO':
        return <PlayCircle className="w-4 h-4 text-rose-500" />;
      case 'PDF':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'MCQ':
      case 'QUIZ':
        return <ListChecks className="w-4 h-4 text-emerald-500" />;
      default:
        return <File className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VIDEO':
        return 'Watch Video';
      case 'PDF':
        return 'Read PDF';
      case 'MCQ':
        return 'Practice';
      default:
        return 'Open Document';
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Library className="w-4 h-4 text-indigo-600" />
            <span>Learning Resources</span>
          </CardTitle>
          <Link href="/trainee/resources">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>Library</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Curated operational guides, satellite video tutorials, and technical reference documents
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {resources.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No learning resources published for your cadre yet.
          </div>
        ) : (
          resources.map((res) => (
            <div
              key={res.id}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {getResourceIcon(res.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{res.title}</h5>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">
                      {res.type}
                    </Badge>
                  </div>
                  {res.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {res.description}
                    </p>
                  )}
                </div>
              </div>

              <a href={res.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold border-slate-200 hover:bg-white text-indigo-600"
                >
                  <span>{getActionLabel(res.type)}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </a>
            </div>
          ))
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainee/resources">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>Explore All Resources</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningResourcesList;
