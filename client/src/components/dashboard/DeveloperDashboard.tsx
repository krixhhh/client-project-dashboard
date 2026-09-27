import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ActivityFeed } from '../activity/ActivityFeed';
import { Skeleton } from '../common/Skeleton';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { CheckSquare, Clock, AlertTriangle, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'developer'],
    queryFn: async () => {
      const res = await api.get('/dashboard/developer');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4">
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </div>
    );
  }

  const metrics = data.metrics;
  const assignedTasks = data.assignedTasks || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="grid grid-cols-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned Tasks</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{metrics.assignedTasksCount}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7' }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>In Progress</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7' }}>{metrics.inProgressCount}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>In Review</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>{metrics.inReviewCount}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Overdue Tasks</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{metrics.overdueTasksCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '24px' }}>
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">My Assigned Tasks</h3>
              <button onClick={() => navigate('/tasks')} className="btn btn-secondary btn-sm">
                View All Tasks
              </button>
            </div>
            {assignedTasks.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No tasks currently assigned to you.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTasks.map((t: any) => (
                      <tr key={t.id} onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                        <td>{t.project?.name}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div className="card-header">
            <h3 className="card-title">My Task Activity</h3>
          </div>
          <ActivityFeed limit={12} />
        </div>
      </div>
    </div>
  );
};
