import { useQuery } from '@tanstack/react-query';
import userApi from '../api/userApi';
import { UserListParams, PaginatedUsersResponse } from '../types/user.types';

export const useUsers = (params?: UserListParams) => {
  return useQuery<PaginatedUsersResponse>({
    queryKey: ['adminUsers', params],
    queryFn: () => userApi.getAdminUsers(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30, // 30 seconds fresh cache
  });
};

export default useUsers;
