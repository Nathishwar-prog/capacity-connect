import apiClient from '@/api/client';
import { ApiResponse } from '@/features/auth/types/auth.types';
import {
  TrainerProfileData,
  TrainerDashboardData,
  TrainerCourseListItem,
  TrainerCourseDetail,
  TrainerTraineeListItem,
  TraineeDetailData,
  TrainerAssessmentItem,
  TrainerAnalyticsData,
  TrainerFeedbackItem,
  CourseModuleItem,
  LessonItem,
} from '../types/trainer.types';

export const trainerApi = {
  // 1. Dashboard
  getDashboard: async (): Promise<TrainerDashboardData> => {
    const res = await apiClient.get<ApiResponse<TrainerDashboardData>>('/trainer/dashboard');
    return res.data.data;
  },

  // 2. Profile & Expertise
  getProfile: async (): Promise<TrainerProfileData> => {
    const res = await apiClient.get<ApiResponse<TrainerProfileData>>('/trainer/profile');
    return res.data.data;
  },

  updateProfile: async (data: {
    designation?: string;
    organizationName?: string;
    bio?: string;
    yearsExperience?: number;
  }) => {
    const res = await apiClient.patch<ApiResponse<any>>('/trainer/profile', data);
    return res.data.data;
  },

  addExpertise: async (data: {
    skillId: string;
    proficiencyLevel: number;
    yearsExperience?: number;
  }) => {
    const res = await apiClient.post<ApiResponse<any>>('/trainer/expertise', data);
    return res.data.data;
  },

  removeExpertise: async (skillId: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(`/trainer/expertise/${skillId}`);
    return res.data.data;
  },

  // 3. Courses
  getCourses: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    courses: TrainerCourseListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> => {
    const res = await apiClient.get<
      ApiResponse<{
        courses: TrainerCourseListItem[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>
    >('/trainer/courses', { params });
    return res.data.data;
  },

  getCourseById: async (courseId: string): Promise<TrainerCourseDetail> => {
    const res = await apiClient.get<ApiResponse<TrainerCourseDetail>>(`/trainer/courses/${courseId}`);
    return res.data.data;
  },

  createCourse: async (data: {
    title: string;
    slug?: string;
    description: string;
    category: string;
    difficulty?: string;
    durationMinutes?: number;
    thumbnailUrl?: string | null;
  }) => {
    const res = await apiClient.post<ApiResponse<any>>('/trainer/courses', data);
    return res.data.data;
  },

  updateCourse: async (courseId: string, data: any) => {
    const res = await apiClient.patch<ApiResponse<any>>(`/trainer/courses/${courseId}`, data);
    return res.data.data;
  },

  deleteCourse: async (courseId: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(`/trainer/courses/${courseId}`);
    return res.data.data;
  },

  submitCourseForApproval: async (courseId: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/trainer/courses/${courseId}/submit`);
    return res.data.data;
  },

  // 4. Modules & Lessons
  createModule: async (
    courseId: string,
    data: { title: string; description?: string | null; orderIndex?: number },
  ): Promise<CourseModuleItem> => {
    const res = await apiClient.post<ApiResponse<CourseModuleItem>>(
      `/trainer/courses/${courseId}/modules`,
      data,
    );
    return res.data.data;
  },

  updateModule: async (
    courseId: string,
    moduleId: string,
    data: { title?: string; description?: string | null; orderIndex?: number },
  ) => {
    const res = await apiClient.patch<ApiResponse<any>>(
      `/trainer/courses/${courseId}/modules/${moduleId}`,
      data,
    );
    return res.data.data;
  },

  deleteModule: async (courseId: string, moduleId: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(
      `/trainer/courses/${courseId}/modules/${moduleId}`,
    );
    return res.data.data;
  },

  createLesson: async (
    courseId: string,
    moduleId: string,
    data: any,
  ): Promise<LessonItem> => {
    const res = await apiClient.post<ApiResponse<LessonItem>>(
      `/trainer/courses/${courseId}/modules/${moduleId}/lessons`,
      data,
    );
    return res.data.data;
  },

  updateLesson: async (courseId: string, moduleId: string, lessonId: string, data: any) => {
    const res = await apiClient.patch<ApiResponse<any>>(
      `/trainer/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      data,
    );
    return res.data.data;
  },

  deleteLesson: async (courseId: string, moduleId: string, lessonId: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(
      `/trainer/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    );
    return res.data.data;
  },

  reorderCourse: async (courseId: string, modules: any[]) => {
    const res = await apiClient.put<ApiResponse<any>>(`/trainer/courses/${courseId}/reorder`, {
      modules,
    });
    return res.data.data;
  },

  mapCompetency: async (
    courseId: string,
    data: { competencyId: string; targetLevel: number },
  ) => {
    const res = await apiClient.post<ApiResponse<any>>(
      `/trainer/courses/${courseId}/competencies`,
      data,
    );
    return res.data.data;
  },

  unmapCompetency: async (courseId: string, competencyId: string) => {
    const res = await apiClient.delete<ApiResponse<any>>(
      `/trainer/courses/${courseId}/competencies/${competencyId}`,
    );
    return res.data.data;
  },

  // 5. Trainees
  getTrainees: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    courseId?: string;
    status?: string;
    progressMin?: number;
    progressMax?: number;
  }): Promise<{
    trainees: TrainerTraineeListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> => {
    const res = await apiClient.get<
      ApiResponse<{
        trainees: TrainerTraineeListItem[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>
    >('/trainer/trainees', { params });
    return res.data.data;
  },

  getTraineeDetail: async (traineeId: string): Promise<TraineeDetailData> => {
    const res = await apiClient.get<ApiResponse<TraineeDetailData>>(
      `/trainer/trainees/${traineeId}`,
    );
    return res.data.data;
  },

  // 6. Assessments
  getAssessments: async (): Promise<TrainerAssessmentItem[]> => {
    const res = await apiClient.get<ApiResponse<TrainerAssessmentItem[]>>('/trainer/assessments');
    return res.data.data;
  },

  getAssessmentById: async (assessmentId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(`/trainer/assessments/${assessmentId}`);
    return res.data.data;
  },

  createAssessment: async (data: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/trainer/assessments', data);
    return res.data.data;
  },

  // 7. Analytics & Feedback
  getAnalytics: async (): Promise<TrainerAnalyticsData> => {
    const res = await apiClient.get<ApiResponse<TrainerAnalyticsData>>('/trainer/analytics');
    return res.data.data;
  },

  getFeedback: async (): Promise<TrainerFeedbackItem[]> => {
    const res = await apiClient.get<ApiResponse<TrainerFeedbackItem[]>>('/trainer/feedback');
    return res.data.data;
  },

  // 8. Document Ingestion & Advanced Course Builder
  uploadCourseDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ jobId: string; documentId: string; status: string }>>(
      '/courses/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data.data;
  },

  getImportJobStatus: async (jobId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(`/courses/import/${jobId}`);
    return res.data.data;
  },

  getImportJobPreview: async (jobId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(`/courses/import/${jobId}/preview`);
    return res.data.data;
  },

  approveImportJob: async (jobId: string, approvedStructure?: any) => {
    const res = await apiClient.post<ApiResponse<any>>(`/courses/import/${jobId}/approve`, {
      approvedStructure,
    });
    return res.data.data;
  },

  validateCourse: async (courseId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(`/courses/${courseId}/validate`);
    return res.data.data;
  },

  publishCourse: async (courseId: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/courses/${courseId}/publish`);
    return res.data.data;
  },

  saveDraft: async (courseId: string, data: any) => {
    const res = await apiClient.patch<ApiResponse<any>>(`/courses/${courseId}/draft`, data);
    return res.data.data;
  },

  getTopicsAndCompetencies: async (courseId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(`/courses/${courseId}/topics-competencies`);
    return res.data.data;
  },

  updateTopicCompetencyMapping: async (courseId: string, data: any) => {
    const res = await apiClient.put<ApiResponse<any>>(`/courses/${courseId}/topics-competencies`, data);
    return res.data.data;
  },
};

export default trainerApi;
