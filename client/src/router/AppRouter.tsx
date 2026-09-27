import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';

import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { TasksPage } from '../pages/TasksPage';
import { ActivityPage } from '../pages/ActivityPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ClientsPage } from '../pages/ClientsPage';
import { UsersPage } from '../pages/UsersPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const ProtectedLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Projects */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            
            {/* Tasks */}
            <Route path="/tasks" element={<TasksPage />} />
            
            {/* Activity & Notifications */}
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Clients (Admin & PM) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']} />}>
              <Route path="/clients" element={<ClientsPage />} />
            </Route>

            {/* Users (Admin Only) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>

            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<ProtectedLayout />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
