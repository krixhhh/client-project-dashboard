import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ActivityFeed } from '../activity/ActivityFeed';
import { Skeleton } from '../common/Skeleton';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { FolderKanban, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PMDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'pm'],
    queryFn: async () => {
      const res = await api.get('/dashboard/project-manager');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3">
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </div>
    );
  }

  const metrics = data.metrics;
  const upcomingTasks = data.upcomingTasks || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="grid grid-cols-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Managed Projects</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{metrics.totalProjects}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Team Tasks</span>
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
      </div>

      <div className="grid grid-cols-3" style={{ gap: '24px' }}>
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} /> Upcoming Due Dates This Week
              </h3>
            </div>
            {upcomingTasks.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No upcoming task deadlines this week.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Project</th>
                      <th>Developer</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingTasks.map((task: any) => (
                      <tr key={task.id} onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600 }}>{task.title}</td>
                        <td>{task.project?.name}</td>
                        <td>{task.developer?.name || 'Unassigned'}</td>
                        <td><PriorityBadge priority={task.priority} /></td>
                        <td>{new Date(task.dueDate).toLocaleDateString()}</td>
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
            <h3 className="card-title">Managed Team Activity</h3>
          </div>
          <ActivityFeed limit={12} />
        </div>
      </div>
    </div>
  );
};
