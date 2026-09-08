import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerApi } from '../api/trainerApi';
import useAuthStore from '@/store/auth';

export const useTrainerDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'dashboard', user?.id],
    queryFn: () => trainerApi.getDashboard(),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 30 * 1000,
  });
};

export const useTrainerProfile = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'profile', user?.id],
    queryFn: () => trainerApi.getProfile(),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 60 * 1000,
  });
};

export const useUpdateTrainerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      designation?: string;
      organizationName?: string;
      bio?: string;
      yearsExperience?: number;
    }) => trainerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'profile'] });
    },
  });
};

export const useAddExpertise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { skillId: string; proficiencyLevel: number; yearsExperience?: number }) =>
      trainerApi.addExpertise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'profile'] });
    },
  });
};

export const useRemoveExpertise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => trainerApi.removeExpertise(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'profile'] });
    },
  });
};

export const useTrainerCourses = (params?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'courses', user?.id, params],
    queryFn: () => trainerApi.getCourses(params),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 30 * 1000,
  });
};

export const useTrainerCourse = (courseId: string) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'course', courseId],
    queryFn: () => trainerApi.getCourseById(courseId),
    enabled: isAuthenticated && Boolean(courseId),
    staleTime: 10 * 1000,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      slug?: string;
      description: string;
      category: string;
      difficulty?: string;
      durationMinutes?: number;
      thumbnailUrl?: string | null;
    }) => trainerApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'dashboard'] });
    },
  });
};

export const useUpdateCourse = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => trainerApi.updateCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => trainerApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'dashboard'] });
    },
  });
};

export const useSubmitCourseForApproval = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => trainerApi.submitCourseForApproval(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'dashboard'] });
    },
  });
};

export const useCreateModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string | null; orderIndex?: number }) =>
      trainerApi.createModule(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useUpdateModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      data,
    }: {
      moduleId: string;
      data: { title?: string; description?: string | null; orderIndex?: number };
    }) => trainerApi.updateModule(courseId, moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useDeleteModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => trainerApi.deleteModule(courseId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useCreateLesson = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: Record<string, unknown> }) =>
      trainerApi.createLesson(courseId, moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useUpdateLesson = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      lessonId,
      data,
    }: {
      moduleId: string;
      lessonId: string;
      data: Record<string, unknown>;
    }) => trainerApi.updateLesson(courseId, moduleId, lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useDeleteLesson = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, lessonId }: { moduleId: string; lessonId: string }) =>
      trainerApi.deleteLesson(courseId, moduleId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useReorderCourse = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modules: unknown[]) => trainerApi.reorderCourse(courseId, modules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useMapCompetency = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { competencyId: string; targetLevel: number }) =>
      trainerApi.mapCompetency(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useUnmapCompetency = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (competencyId: string) => trainerApi.unmapCompetency(courseId, competencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'course', courseId] });
    },
  });
};

export const useTrainerTrainees = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  courseId?: string;
  status?: string;
  progressMin?: number;
  progressMax?: number;
}) => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'trainees', user?.id, params],
    queryFn: () => trainerApi.getTrainees(params),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 30 * 1000,
  });
};

export const useTrainerTraineeDetail = (traineeId: string) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'trainee', traineeId],
    queryFn: () => trainerApi.getTraineeDetail(traineeId),
    enabled: isAuthenticated && Boolean(traineeId),
    staleTime: 30 * 1000,
  });
};

export const useTrainerAssessments = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'assessments', user?.id],
    queryFn: () => trainerApi.getAssessments(),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 30 * 1000,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => trainerApi.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', 'assessments'] });
    },
  });
};

export const useTrainerAnalytics = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'analytics', user?.id],
    queryFn: () => trainerApi.getAnalytics(),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 60 * 1000,
  });
};

export const useTrainerFeedback = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['trainer', 'feedback', user?.id],
    queryFn: () => trainerApi.getFeedback(),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 60 * 1000,
  });
};
