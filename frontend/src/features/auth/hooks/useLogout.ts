import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/authApi';
import useAuthStore from '@/store/auth';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Clear client store
      logout();

      // Clear TanStack query cache
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    },
  });
};

export default useLogout;
