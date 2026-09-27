import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSocketContext } from '../../context/SocketContext';
import { ActivityLog } from '../../types';
import { RoleBadge } from '../common/Badge';
import { Clock, Activity as ActivityIcon } from 'lucide-react';

export const ActivityFeed: React.FC<{ limit?: number }> = ({ limit = 20 }) => {
  const { liveActivities } = useSocketContext();

  const { data: dbActivities, isLoading } = useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const res = await api.get(`/activity?limit=${limit}`);
      return res.data.data as ActivityLog[];
    },
  });

  // Combine live activities with DB activities, removing duplicates by ID
  const allActivitiesMap = new Map<string, ActivityLog>();
  
  if (dbActivities) {
    dbActivities.forEach((act) => allActivitiesMap.set(act.id, act));
  }
  liveActivities.forEach((act) => allActivitiesMap.set(act.id, act));

  const sortedActivities = Array.from(allActivitiesMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (isLoading) {
    return <div style={{ padding: '16px', color: '#64748b' }}>Loading activity feed...</div>;
  }

  if (sortedActivities.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        No recent activities recorded
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      {sortedActivities.map((activity) => (
        <div key={activity.id} className="activity-item">
          <div className="activity-icon-container">
            <ActivityIcon size={16} color="#2563eb" />
          </div>
          <div className="activity-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="activity-actor">{activity.actor?.name || 'System'}</span>
              {activity.actor?.role && <RoleBadge role={activity.actor.role} />}
              <span className="activity-time">
                <Clock size={12} />
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="activity-message">{activity.message}</p>
            {activity.project && (
              <span className="activity-project-tag">Project: {activity.project.name}</span>
            )}
          </div>
        </div>
      ))}

      <style>{`
        .activity-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .activity-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .activity-icon-container {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .activity-details {
          flex: 1;
        }
        .activity-actor {
          font-weight: 600;
          font-size: 0.875rem;
          color: #0f172a;
        }
        .activity-time {
          font-size: 0.75rem;
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .activity-message {
          font-size: 0.875rem;
          color: #334155;
          margin-top: 4px;
        }
        .activity-project-tag {
          display: inline-block;
          font-size: 0.75rem;
          color: #64748b;
          background-color: #f8fafc;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
};
