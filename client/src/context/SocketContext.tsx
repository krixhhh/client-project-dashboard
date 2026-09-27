import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityLog, NotificationItem } from '../types';

interface PresenceData {
  count: number;
  users: Array<{ userId: string; name: string; email: string; role: string; connectedAt: string }>;
}

interface SocketContextType {
  socket: Socket | null;
  unreadNotificationsCount: number;
  onlinePresence: PresenceData | null;
  liveActivities: ActivityLog[];
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [onlinePresence, setOnlinePresence] = useState<PresenceData | null>(null);
  const [liveActivities, setLiveActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const sk = connectSocket();
    setSocket(sk);

    // Activity Log Handler (Deduplicated by Activity ID - Requirement 25)
    const handleActivityCreated = (newActivity: ActivityLog) => {
      setLiveActivities((prev) => {
        if (prev.some((a) => a.id === newActivity.id)) {
          return prev;
        }
        return [newActivity, ...prev];
      });

      // Invalidate relevant queries so UI updates instantly
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    // Notification Handler
    const handleNotificationCreated = (newNotif: NotificationItem) => {
      setUnreadNotificationsCount((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    // Unread Count Handler
    const handleUnreadCount = (data: { unreadCount: number }) => {
      setUnreadNotificationsCount(data.unreadCount);
    };

    // Online Presence Handler
    const handlePresence = (presence: PresenceData) => {
      setOnlinePresence(presence);
    };

    sk.on('activity.created', handleActivityCreated);
    sk.on('notification.created', handleNotificationCreated);
    sk.on('notification.unreadCount', handleUnreadCount);
    sk.on('user.presence', handlePresence);

    if (sk.connected) {
      sk.emit('get_presence');
    }

    const onConnect = () => {
      sk.emit('get_presence');
    };

    sk.on('connect', onConnect);

    return () => {
      sk.off('activity.created', handleActivityCreated);
      sk.off('notification.created', handleNotificationCreated);
      sk.off('notification.unreadCount', handleUnreadCount);
      sk.off('user.presence', handlePresence);
      sk.off('connect', onConnect);
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadNotificationsCount,
        onlinePresence,
        liveActivities,
        setUnreadNotificationsCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
