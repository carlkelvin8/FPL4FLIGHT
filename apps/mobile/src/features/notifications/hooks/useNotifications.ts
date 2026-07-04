import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { notificationRepository, type NotificationItem } from "../repositories/NotificationRepository";

const NOTIF_KEY = ["notifications"];

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: NOTIF_KEY,
    queryFn: async () => {
      const result = await notificationRepository.findAll();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationRepository.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIF_KEY }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationRepository.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIF_KEY }),
  });

  useEffect(() => {
    const unsubscribe = notificationRepository.subscribe((notification: NotificationItem) => {
      queryClient.setQueryData<NotificationItem[]>(NOTIF_KEY, (old) => {
        if (!old) return [notification];
        return [notification, ...old];
      });
    });
    return unsubscribe;
  }, [queryClient]);

  return {
    notifications: data ?? [],
    isLoading,
    error: error?.message ?? null,
    unreadCount: (data ?? []).filter((n) => !n.read).length,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    refetch,
  };
}
