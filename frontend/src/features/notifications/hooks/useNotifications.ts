import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationApi, { NotificationsResponse } from '../api/notificationApi';
import useAuthStore from '@/store/auth';

export const useNotifications = (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const query = useQuery<NotificationsResponse>({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getMyNotifications(params),
    enabled: isAuthenticated,
    refetchInterval: 1000 * 20, // Poll every 20 seconds
    staleTime: 1000 * 10,
  });

  // Optimistic single notification deletion on mark as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousData = queryClient.getQueryData<NotificationsResponse>(['notifications', params]);
      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(['notifications', params], {
          ...previousData,
          notifications: previousData.notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        });
      }
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', params], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Optimistic clear all notifications
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousData = queryClient.getQueryData<NotificationsResponse>(['notifications', params]);
      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(['notifications', params], {
          ...previousData,
          notifications: [],
          unreadCount: 0,
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', params], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    ...query,
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};

export default useNotifications;
