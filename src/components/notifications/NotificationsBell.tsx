
"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Inbox } from 'lucide-react';
import { AppNotification } from '@/types';
import NotificationItem from './NotificationItem';
import { ScrollArea } from '../ui/scroll-area';
import { useApp } from '@/providers/AppProvider';

async function fetchNotifications(userId: string | undefined): Promise<{ notifications: AppNotification[], unreadCount: number }> {
    if (!userId) return { notifications: [], unreadCount: 0 };
    const res = await fetch(`/api/notifications?userId=${userId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch notifications');
    }
    return res.json();
}

async function markNotificationsAsRead(notificationIds: string[], userId: string | undefined) {
    if (notificationIds.length === 0 || !userId) return;
    await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, userId }),
    });
}

const NotificationsBell = () => {
  const { state } = useApp();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const userId = state.userProfile.firebaseUid;

  const { data, isLoading, error } = useQuery<{ notifications: AppNotification[], unreadCount: number }>({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId),
    enabled: state.userProfile.isAuthenticated && !!userId,
    refetchInterval: 60000, // Refetch every 60 seconds
    refetchOnWindowFocus: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) => markNotificationsAsRead(notificationIds, userId),
    onSuccess: () => {
      // Invalidate to refetch fresh data from the server
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  useEffect(() => {
    if (isOpen && data?.notifications) {
      const unreadIds = data.notifications.filter(n => !n.read).map(n => n._id as string);
      if (unreadIds.length > 0) {
        // Optimistically update the UI before the API call returns
        queryClient.setQueryData(['notifications', userId], (oldData: any) => ({
            ...oldData,
            unreadCount: 0,
            notifications: oldData.notifications.map((n: AppNotification) => ({ ...n, read: true }))
        }));
        markAsReadMutation.mutate(unreadIds);
      }
    }
  }, [isOpen, data, markAsReadMutation, queryClient, userId]);


  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  if (!state.userProfile.isAuthenticated) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? <BellRing className="h-5 w-5 animate-pulse" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Ver notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm">Notificaciones</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <p className="p-4 text-sm text-center text-muted-foreground">Cargando...</p>
          ) : error ? (
            <p className="p-4 text-sm text-center text-destructive">Error al cargar.</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 mb-2"/>
                <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map(notification => (
                <NotificationItem key={notification._id as string} notification={notification} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
