import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/authApi';
import { RegisterInput, RegisterResponse, ApiErrorResponse } from '../types/auth.types';
import useAuthStore from '@/store/auth';

interface UseRegisterOptions {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: AxiosError<ApiErrorResponse> | Error) => void;
}

export const useRegister = (options?: UseRegisterOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setCredentials } = useAuthStore();

  return useMutation<RegisterResponse, AxiosError<ApiErrorResponse> | Error, RegisterInput>({
    mutationFn: (userData: RegisterInput) => authApi.register(userData),
    onSuccess: (data) => {
      // Registration sets account to PENDING status awaiting Admin Approval
      if (options?.onSuccess) {
        options.onSuccess(data);
      } else {
        router.push('/login?pending=true');
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
