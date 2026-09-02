import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/authApi';
import { LoginInput, AuthResponse, ApiErrorResponse } from '../types/auth.types';
import useAuthStore from '@/store/auth';

interface UseLoginOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse> | Error) => void;
}

export const useLogin = (options?: UseLoginOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setCredentials } = useAuthStore();

  return useMutation<AuthResponse, AxiosError<ApiErrorResponse> | Error, LoginInput>({
    mutationFn: (credentials: LoginInput) => authApi.login(credentials),
    onSuccess: (data) => {
      // Update global client auth store
      setCredentials(
        {
          id: data.user.id,
          organizationId: data.user.organizationId,
          organizationName: data.user.organizationName,
          departmentId: data.user.departmentId,
          departmentName: data.user.departmentName,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          status: data.user.status,
          permissions: data.user.permissions,
          traineeProfile: data.user.traineeProfile,
          trainerProfile: data.user.trainerProfile,
        },
        data.accessToken,
      );

      // Invalidate current user cache
      queryClient.setQueryData(['currentUser'], data.user);

      if (options?.onSuccess) {
        options.onSuccess(data);
      } else {
        router.push('/');
      }
    },
    onError: (error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};

export default useLogin;
