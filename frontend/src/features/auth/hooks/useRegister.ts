import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/authApi';
import { RegisterInput, AuthResponse, ApiErrorResponse } from '../types/auth.types';
import useAuthStore from '@/store/auth';

interface UseRegisterOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse> | Error) => void;
}

export const useRegister = (options?: UseRegisterOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setCredentials } = useAuthStore();

  return useMutation<AuthResponse, AxiosError<ApiErrorResponse> | Error, RegisterInput>({
    mutationFn: (userData: RegisterInput) => authApi.register(userData),
    onSuccess: (data) => {
      // Set credentials in Zustand store
      setCredentials(
        {
          id: data.user.id,
          organizationId: data.user.organizationId,
          departmentId: data.user.departmentId,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          status: data.user.status,
          permissions: data.user.permissions,
        },
        data.accessToken,
      );

      // Seed current user cache
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

export default useRegister;
