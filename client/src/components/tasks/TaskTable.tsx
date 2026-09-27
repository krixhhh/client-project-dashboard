import React from 'react';
import { Task, TaskStatus } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { Clock, Eye, Edit, AlertTriangle } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onSelectTask,
  onEditTask,
  onStatusChange,
}) => {
  const { user } = useAuth();
  const now = new Date();

  if (tasks.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        No tasks matching criteria.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Project</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const dueDate = new Date(task.dueDate);
            const isOverdue = (task.isOverdue || dueDate < now) && task.status !== 'DONE';

            return (
              <tr key={task.id}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isOverdue && <span title="Overdue task!"><AlertTriangle size={16} color="#dc2626" /></span>}
                    <span
                      onClick={() => onSelectTask(task)}
                      style={{ cursor: 'pointer', color: '#0f172a' }}
                      className="task-title-link"
                    >
                      {task.title}
                    </span>
                  </div>
                </td>
                <td>{task.project?.name || 'N/A'}</td>
                <td>
                  {task.developer ? (
                    <span style={{ fontWeight: 500, color: '#334155' }}>{task.developer.name}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </td>
                <td>
                  {onStatusChange ? (
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="form-select"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        width: 'auto',
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  ) : (
                    <StatusBadge status={task.status} isOverdue={isOverdue} />
                  )}
                </td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: isOverdue ? '#dc2626' : '#475569',
                      fontWeight: isOverdue ? 700 : 400,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={12} />
                    {dueDate.toLocaleDateString()}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      onClick={() => onSelectTask(task)}
                      className="btn btn-secondary btn-sm"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>

                    {user?.role !== 'DEVELOPER' && onEditTask && (
                      <button
                        onClick={() => onEditTask(task)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Task"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        .task-title-link:hover {
          color: #2563eb !important;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
