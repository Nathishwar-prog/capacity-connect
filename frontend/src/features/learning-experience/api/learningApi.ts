import { apiClient } from '@/api/client';
import {
  CourseLearningOverview,
  LessonDetail,
  CompleteLessonResponse,
  CourseProgressSummary,
} from '../types/learning-experience.types';

export const learningApi = {
  /**
   * Get full course learning structure, modules, lessons, and trainee progress
   */
  getCourseOverview: async (courseId: string): Promise<CourseLearningOverview> => {
    const response = await apiClient.get<{ success: boolean; data: CourseLearningOverview }>(
      `/learning/courses/${courseId}`,
    );
    return response.data.data;
  },

  /**
   * Get lesson detail with resource (video/pdf/document) and navigation context
   */
  getLessonDetails: async (lessonId: string): Promise<LessonDetail> => {
    const response = await apiClient.get<{ success: boolean; data: LessonDetail }>(
      `/learning/lessons/${lessonId}`,
    );
    return response.data.data;
  },

  /**
   * Mark a lesson as complete and update overall course progress
   */
  completeLesson: async (lessonId: string): Promise<CompleteLessonResponse> => {
    const response = await apiClient.post<{ success: boolean; data: CompleteLessonResponse }>(
      `/learning/lessons/${lessonId}/complete`,
    );
    return response.data.data;
  },

  /**
   * Get progress metrics for a course
   */
  getCourseProgress: async (courseId: string): Promise<CourseProgressSummary> => {
    const response = await apiClient.get<{ success: boolean; data: CourseProgressSummary }>(
      `/learning/courses/${courseId}/progress`,
    );
    return response.data.data;
  },
};
