import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { TraineeOnboardingInput, AuthUser, OnboardingMeta } from '../types/auth.types';
import useAuthStore from '@/store/auth';

export const useOnboardingMeta = () => {
  return useQuery<OnboardingMeta>({
    queryKey: ['onboardingMeta'],
    queryFn: () => authApi.getOnboardingMeta(),
    staleTime: 1000 * 60 * 15, // 15 minutes fresh
  });
};

interface UseSubmitOnboardingOptions {
  onSuccess?: (user: AuthUser) => void;
  onError?: (error: unknown) => void;
}

export const useSubmitOnboarding = (options?: UseSubmitOnboardingOptions) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<AuthUser, unknown, TraineeOnboardingInput>({
    mutationFn: (data: TraineeOnboardingInput) => authApi.submitTraineeOnboarding(data),
    onSuccess: (updatedUser) => {
      // Update global user state in Zustand
      setUser({
        id: updatedUser.id,
        organizationId: updatedUser.organizationId,
        departmentId: updatedUser.departmentId,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        status: updatedUser.status,
        permissions: updatedUser.permissions,
      });

      // Update current user cache
      queryClient.setQueryData(['currentUser'], updatedUser);

      if (options?.onSuccess) {
        options.onSuccess(updatedUser);
      }
    },
    onError: (error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};

export default useSubmitOnboarding;
