import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSocketContext } from '../../context/SocketContext';
import { ActivityFeed } from '../activity/ActivityFeed';
import { Skeleton } from '../common/Skeleton';
import { RoleBadge } from '../common/Badge';
import {
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
  Radio,
  Building2,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { onlinePresence } = useSocketContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const res = await api.get('/dashboard/admin');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4" style={{ gap: '16px' }}>
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </div>
    );
  }

  if (error) {
    return <div className="card" style={{ color: '#dc2626' }}>Failed to load admin dashboard statistics.</div>;
  }

  const metrics = data.metrics;
  const statusCounts = data.statusCounts;
  const priorityCounts = data.priorityCounts;

  const onlineUsersList = onlinePresence?.users || metrics.onlineUsers || [];
  const onlineCount = onlinePresence?.count !== undefined ? onlinePresence.count : metrics.onlineUsersCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metrics Row */}
      <div className="grid grid-cols-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Projects</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{metrics.totalProjects}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Tasks</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{metrics.totalTasks}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Overdue Tasks</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{metrics.overdueTasks}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7' }}>
            <Radio size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Active Online Users</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7' }}>
              {onlineCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#16a34a' }}>● Live</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Status & Online Users + Global Feed */}
      <div className="grid grid-cols-3" style={{ gap: '24px' }}>
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Breakdown Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> Task Progress & Status Overview
              </h3>
            </div>
            <div className="grid grid-cols-4" style={{ gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TO DO</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#475569', marginTop: '4px' }}>{statusCounts.TODO}</h4>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>IN PROGRESS</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>{statusCounts.IN_PROGRESS}</h4>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>IN REVIEW</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>{statusCounts.IN_REVIEW}</h4>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>DONE</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>{statusCounts.DONE}</h4>
              </div>
            </div>
          </div>

          {/* Active Online Users Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> Active Connected Team Members
              </h3>
            </div>
            {onlineUsersList.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No active users connected right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {onlineUsersList.map((u: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({u.email})</span>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Activity Feed Column */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div className="card-header">
            <h3 className="card-title">Global Activity Feed</h3>
          </div>
          <ActivityFeed limit={15} />
        </div>
      </div>
    </div>
  );
};
