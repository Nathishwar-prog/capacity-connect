import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import announcementApi, {
  CreateAnnouncementPayload,
  PaginatedAnnouncementsResponse,
} from '../api/announcementApi';

export const useAnnouncements = (params?: { page?: number; limit?: number; audience?: string }) => {
  const queryClient = useQueryClient();

  const query = useQuery<PaginatedAnnouncementsResponse>({
    queryKey: ['adminAnnouncements', params],
    queryFn: () => announcementApi.getAnnouncements(params),
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => announcementApi.createAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    ...query,
    announcements: query.data?.announcements || [],
    meta: query.data?.meta,
    createAnnouncement: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};

export default useAnnouncements;
