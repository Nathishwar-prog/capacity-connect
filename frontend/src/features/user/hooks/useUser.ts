import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import { UpdateUserPayload } from '../types/user.types';
import { useAuthStore } from '../../../store/auth';

export const useUser = () => {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuthStore();

  // Query profile if authenticated
  const profileQuery = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => userApi.getProfile(),
    enabled: !!authUser,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => userApi.updateUser(authUser?.id || '', payload),
    onSuccess: (updatedUser) => {
      setUser({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
        organizationId: authUser?.organizationId,
        departmentId: updatedUser.departmentId || authUser?.departmentId,
      });
      queryClient.invalidateQueries({ queryKey: ['profile', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
    },
  });

  // Mutation to update user status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      userApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
    },
  });

  // Mutation to approve user
  const approveUserMutation = useMutation({
    mutationFn: (id: string) => userApi.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
    },
  });

  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    profileError: profileQuery.error,

    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,

    updateUserRole: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,

    updateUserStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,

    approveUser: approveUserMutation.mutateAsync,
    isApprovingUser: approveUserMutation.isPending,

    deleteUser: deleteUserMutation.mutateAsync,
    isDeletingUser: deleteUserMutation.isPending,
  };
};

export default useUser;
