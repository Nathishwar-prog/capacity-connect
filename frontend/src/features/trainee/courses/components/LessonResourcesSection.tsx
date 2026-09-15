'use client';

import React from 'react';
import {
  Paperclip,
  FileText,
  Video,
  Download,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import { LessonResourceItem } from '../types/viewer.types';

interface LessonResourcesSectionProps {
  resources?: LessonResourceItem[];
}

export const LessonResourcesSection = React.memo(function LessonResourcesSection({
  resources,
}: LessonResourcesSectionProps) {
  if (!resources || resources.length === 0) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getResourceIcon = (type: string, mime?: string | null) => {
    if (type === 'VIDEO' || mime?.includes('video')) {
      return <Video className="w-4 h-4 text-rose-400" />;
    }
    if (mime?.includes('pdf') || type === 'PDF') {
      return <FileText className="w-4 h-4 text-red-400" />;
    }
    if (type === 'CODE' || mime?.includes('json') || mime?.includes('xml')) {
      return <FileCode className="w-4 h-4 text-amber-400" />;
    }
    return <FileText className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Attached Operational Resources & References ({resources.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((res) => {
          const sizeStr = formatFileSize(res.fileSize);

          return (
            <div
              key={res.id}
              className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  {getResourceIcon(res.resourceType, res.mimeType)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {res.title || res.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {res.resourceType} {sizeStr ? `• ${sizeStr}` : ''}
                  </p>
                </div>
              </div>

              {res.url ? (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                  title="Open / Download Resource"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  disabled
                  className="p-2 rounded-lg text-slate-600 cursor-not-allowed shrink-0"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
