import React from 'react';
import { Modal } from '../common/Modal';
import { Task, TaskStatus } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Clock, User as UserIcon, FolderKanban, Activity as ActivityIcon } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  if (!task) return null;

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const isOverdue = (task.isOverdue || dueDate < now) && task.status !== 'DONE';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Task Details: #${task.id.slice(0, 8)}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            {task.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <StatusBadge status={task.status} isOverdue={isOverdue} />
            <PriorityBadge priority={task.priority} />
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> Due: {dueDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
            {task.description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={18} color="#64748b" />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Project</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                {task.project?.name || 'N/A'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon size={18} color="#64748b" />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Assigned Developer</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                {task.developer?.name || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {onStatusChange && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Update Task Status:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(task.id, st)}
                  className={`btn ${task.status === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {task.activityLogs && task.activityLogs.length > 0 && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ActivityIcon size={16} /> Task Activity History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {task.activityLogs.map((act) => (
                <div key={act.id} style={{ fontSize: '0.8rem', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{act.actor?.name || 'System'}:</span> {act.message}
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '8px' }}>
                    {new Date(act.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
