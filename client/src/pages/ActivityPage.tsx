import React from 'react';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { Activity } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} color="#2563eb" /> Live Activity Feed & Audit Trail
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
          Real-time role-scoped activity history and system events
        </p>
      </div>

      <div className="card">
        <ActivityFeed limit={50} />
      </div>
    </div>
  );
};
