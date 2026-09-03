import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import useAuthStore from '@/store/auth';

export const useTraineeDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'trainee', user?.id],
    queryFn: () => dashboardApi.getTraineeDashboard(),
    enabled: isAuthenticated && user?.role === 'TRAINEE',
    staleTime: 60 * 1000,
  });
};

export const useTrainerDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'trainer', user?.id],
    queryFn: () => dashboardApi.getTrainerDashboard(),
    enabled:
      isAuthenticated &&
      (user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 60 * 1000,
  });
};

export const useAdminDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdminDashboard(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
    staleTime: 60 * 1000,
  });
};
