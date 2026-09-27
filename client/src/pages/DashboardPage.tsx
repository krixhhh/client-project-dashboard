import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { PMDashboard } from '../components/dashboard/PMDashboard';
import { DeveloperDashboard } from '../components/dashboard/DeveloperDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
          Welcome back, {user.name} 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
          Real-Time Workspace Overview & Activity Feed ({user.role.replace('_', ' ')})
        </p>
      </div>

      {user.role === 'ADMIN' && <AdminDashboard />}
      {user.role === 'PROJECT_MANAGER' && <PMDashboard />}
      {user.role === 'DEVELOPER' && <DeveloperDashboard />}
    </div>
  );
};
