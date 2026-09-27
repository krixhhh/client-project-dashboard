import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { NotificationItem } from '../types';
import { Skeleton } from '../components/common/Skeleton';
import { Bell, Check, CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
  });

  const notifications: NotificationItem[] = data?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/notifications/read-all');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} color="#2563eb" /> Notifications Inbox
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Real-time alerts for task assignments, reviews, and overdue warnings
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button onClick={() => markAllReadMutation.mutate()} className="btn btn-secondary">
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {isLoading ? (
        <Skeleton height="200px" />
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Your notification inbox is clear!
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: notif.isRead ? '#ffffff' : '#f0f7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{notif.title}</span>
                  {!notif.isRead && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#2563eb', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                      NEW
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: '4px' }}>{notif.message}</p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => markReadMutation.mutate(notif.id)}
                  className="btn btn-secondary btn-sm"
                  title="Mark read"
                >
                  <Check size={14} /> Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
