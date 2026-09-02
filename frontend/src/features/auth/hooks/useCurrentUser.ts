import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { AuthUser } from '../types/auth.types';
import useAuthStore from '@/store/auth';

export const useCurrentUser = () => {
  const { token, setUser, isAuthenticated } = useAuthStore();

  return useQuery<AuthUser>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await authApi.getMe();
      // Sync store user state
      setUser({
        id: user.id,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        departmentId: user.departmentId,
        departmentName: user.departmentName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        traineeProfile: user.traineeProfile,
        trainerProfile: user.trainerProfile,
      });
      return user;
    },
    enabled: !!token || isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    retry: 1,
  });
};

export default useCurrentUser;
