import { apiClient } from '@/api/client';
import {
  CourseListResponse,
  CourseDetails,
  CourseQueryParams,
  CourseFiltersMetadata,
} from '../types/course-discovery.types';

export const courseDiscoveryApi = {
  getCourses: async (params: CourseQueryParams): Promise<CourseListResponse> => {
    const response = await apiClient.get<{ success: boolean; data: CourseListResponse }>(
      '/courses',
      { params },
    );
    return response.data.data;
  },

  getCourseDetails: async (courseId: string): Promise<CourseDetails> => {
    const response = await apiClient.get<{ success: boolean; data: CourseDetails }>(
      `/courses/${courseId}`,
    );
    return response.data.data;
  },

  enrollInCourse: async (courseId: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { enrollmentId: string; courseId: string; status: string };
    }>(`/courses/${courseId}/enroll`);
    return response.data;
  },

  getFiltersMetadata: async (): Promise<CourseFiltersMetadata> => {
    const response = await apiClient.get<{ success: boolean; data: CourseFiltersMetadata }>(
      '/courses/meta/filters',
    );
    return response.data.data;
  },
};
