import { apiClient } from '@/api/client';
import {
  CourseOutlineData,
  LessonDetailData,
  CompleteLessonResponse,
} from '../types/viewer.types';

export const courseViewerApi = {
  /**
   * Fetch lightweight course outline, module structure, and learner progress summary
   */
  async getCourseOutline(courseId: string): Promise<CourseOutlineData> {
    const res = await apiClient.get(`/courses/${courseId}/outline`);
    return res.data.data;
  },

  /**
   * Lazy load full detailed content for a selected lesson
   */
  async getLessonDetail(courseId: string, lessonId: string): Promise<LessonDetailData> {
    const res = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}`);
    return res.data.data;
  },

  /**
   * Complete a lesson with idempotent backend persistence
   */
  async completeLesson(courseId: string, lessonId: string): Promise<CompleteLessonResponse> {
    const res = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
    return res.data.data;
  },

  /**
   * Record knowledge check attempt / quiz interaction for the Adaptive Revision Engine
   */
  async submitKnowledgeCheck(payload: {
    courseId: string;
    lessonId: string;
    questionId: string;
    isCorrect: boolean;
    responseTimeMs?: number;
    confidenceRating?: number;
  }) {
    try {
      await apiClient.post('/learning-events', {
        courseId: payload.courseId,
        lessonId: payload.lessonId,
        questionId: payload.questionId,
        eventType: 'QUIZ_ANSWERED',
        isCorrect: payload.isCorrect,
        score: payload.isCorrect ? 100 : 0,
        maxScore: 100,
        timeSpentSeconds: Math.round((payload.responseTimeMs || 3000) / 1000),
        confidenceSelfReport: payload.confidenceRating ? Math.round(payload.confidenceRating * 5) : 3,
        metadata: { source: 'LMS_KNOWLEDGE_CHECK' },
      });
    } catch (err) {
      // Non-blocking catch so quiz UI does not break if network blips
      console.warn('[courseViewerApi] Knowledge check event submission warning:', err);
    }
  },
};
