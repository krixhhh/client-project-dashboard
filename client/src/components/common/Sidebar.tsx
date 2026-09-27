import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  Bell,
  Building2,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isPM = user.role === 'PROJECT_MANAGER';
  const isDev = user.role === 'DEVELOPER';

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <ShieldAlert size={24} color="#3b82f6" />
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
          DevDash SaaS
        </span>
      </div>

      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        {(isAdmin || isPM) && (
          <NavLink
            to="/projects"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FolderKanban size={18} /> Projects
          </NavLink>
        )}

        <NavLink
          to="/tasks"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={18} /> {isDev ? 'My Assigned Tasks' : 'Task Board'}
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Activity size={18} /> Activity Feed
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Bell size={18} /> Notifications
        </NavLink>

        {(isAdmin || isPM) && (
          <NavLink
            to="/clients"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Building2 size={18} /> Clients
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} /> User Management
          </NavLink>
        )}
      </nav>

      <style>{`
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.15s ease;
        }
        .sidebar-link:hover {
          background-color: #1e293b;
          color: #ffffff;
        }
        .sidebar-link.active {
          background-color: #2563eb;
          color: #ffffff;
        }
      `}</style>
    </aside>
  );
};
