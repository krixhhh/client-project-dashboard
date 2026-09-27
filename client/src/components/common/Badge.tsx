import React from 'react';
import { TaskStatus, TaskPriority } from '../../types';

export const StatusBadge: React.FC<{ status: TaskStatus | 'OVERDUE'; isOverdue?: boolean }> = ({ status, isOverdue }) => {
  if (isOverdue && status !== 'DONE') {
    return <span className="badge badge-overdue">OVERDUE</span>;
  }

  switch (status) {
    case 'TODO':
      return <span className="badge badge-todo">To Do</span>;
    case 'IN_PROGRESS':
      return <span className="badge badge-in-progress">In Progress</span>;
    case 'IN_REVIEW':
      return <span className="badge badge-in-review">In Review</span>;
    case 'DONE':
      return <span className="badge badge-done">Done</span>;
    case 'OVERDUE':
      return <span className="badge badge-overdue">Overdue</span>;
    default:
      return <span className="badge">{status}</span>;
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  switch (priority) {
    case 'LOW':
      return <span className="badge badge-low">Low</span>;
    case 'MEDIUM':
      return <span className="badge badge-medium">Medium</span>;
    case 'HIGH':
      return <span className="badge badge-high">High</span>;
    case 'CRITICAL':
      return <span className="badge badge-critical">Critical</span>;
    default:
      return <span className="badge">{priority}</span>;
  }
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  let styleClass = 'badge-medium';
  if (role === 'ADMIN') styleClass = 'badge-critical';
  if (role === 'PROJECT_MANAGER') styleClass = 'badge-high';
  if (role === 'DEVELOPER') styleClass = 'badge-in-progress';

  return <span className={`badge ${styleClass}`}>{role.replace('_', ' ')}</span>;
};
