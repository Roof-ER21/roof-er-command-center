import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from './useSocket';
import type { Notification } from '@shared/schema';
import { useToast } from './useToast';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socket = useSocket();

  // Fetch notifications
  const { data, isLoading, error } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });

  // Fetch unread count
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/count');
      if (!res.ok) throw new Error('Failed to fetch count');
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });

  // Clear all read notifications
  const clearReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/clear-read', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear notifications');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
      toast({
        title: 'Notifications cleared',
        description: 'All read notifications have been removed.',
      });
    },
  });

  // WebSocket subscription for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      // Add to cache
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (old) => {
          if (!old) return { notifications: [notification], unreadCount: 1 };
          return {
            notifications: [notification, ...old.notifications],
            unreadCount: old.unreadCount + 1,
          };
        }
      );

      // Update count
      queryClient.setQueryData<{ count: number }>(
        ['notifications', 'count'],
        (old) => ({ count: (old?.count || 0) + 1 })
      );

      // Show toast for important notifications
      if (['achievement', 'level_up', 'pto_approved', 'contest_update'].includes(notification.type)) {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, queryClient, toast]);

  return {
    notifications: data?.notifications || [],
    unreadCount: countData?.count ?? data?.unreadCount ?? 0,
    isLoading,
    error,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id),
    clearRead: () => clearReadMutation.mutate(),
  };
}
