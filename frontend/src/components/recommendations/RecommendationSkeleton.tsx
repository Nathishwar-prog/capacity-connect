'use client';

import React from 'react';

export const RecommendationSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm animate-pulse flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded mb-4" />
            <div className="h-12 w-full bg-blue-50 dark:bg-blue-950/30 rounded-lg" />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};
