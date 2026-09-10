'use client';

import React, { useState } from 'react';
import { apiClient } from '../../api/client';

interface FeedbackModalProps {
  isOpen: boolean;
  recommendationId: string;
  courseTitle: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const FEEDBACK_OPTIONS = [
  { type: 'NOT_RELEVANT', label: 'Not relevant to my current role or learning goals' },
  { type: 'ALREADY_KNOW_THIS', label: 'I already know this material' },
  { type: 'TOO_DIFFICULT', label: 'Too advanced / missing prerequisite skills' },
  { type: 'TOO_EASY', label: 'Too basic for my experience level' },
  { type: 'WRONG_TOPIC', label: 'Not interested in this specific topic right now' },
  { type: 'NOT_NOW', label: 'Interesting, but save for later' },
];

export const RecommendationFeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  recommendationId,
  courseTitle,
  onClose,
  onSubmitted,
}) => {
  const [selectedType, setSelectedType] = useState<string>('NOT_RELEVANT');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/recommendations/feedback', {
        recommendationId,
        feedbackType: selectedType,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onSubmitted) onSubmitted();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl transition-all">
        {submitted ? (
          <div className="text-center py-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thank You!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your feedback refines your personalized learning recommendations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Improve Recommendations
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
              Course: <span className="font-medium text-gray-700 dark:text-gray-300">{courseTitle}</span>
            </p>

            <div className="space-y-2 mb-4">
              {FEEDBACK_OPTIONS.map((opt) => (
                <label
                  key={opt.type}
                  className={`flex items-center p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedType === opt.type
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 font-medium'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="feedbackType"
                    value={opt.type}
                    checked={selectedType === opt.type}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional comments (optional)..."
              rows={2}
              className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
