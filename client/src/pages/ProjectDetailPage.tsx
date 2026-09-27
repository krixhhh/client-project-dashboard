import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { Project, Task, User, TaskStatus } from '../types';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { Skeleton } from '../components/common/Skeleton';
import { ArrowLeft, Plus, FolderKanban, Building2, User as UserIcon, Calendar } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Request Socket.IO server to join project room with authorization check!
  useEffect(() => {
    if (socket && projectId) {
      socket.emit('join_project_room', projectId);
    }
  }, [socket, projectId]);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data.data;
    },
    enabled: !!projectId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    },
    enabled: user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER',
  });

  const developers = users.filter((u) => u.role === 'DEVELOPER');

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await api.post('/tasks', formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: any }) => {
      const res = await api.patch(`/tasks/${id}`, formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton height="200px" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-container">
        <div className="card" style={{ color: '#dc2626' }}>
          {(error as any)?.response?.data?.error?.message || 'Project not found or forbidden'}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button onClick={() => navigate('/projects')} className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Project Header Banner */}
      <div className="card" style={{ marginBottom: '24px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <FolderKanban size={24} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{project.name}</h1>
            </div>
            <p style={{ marginTop: '8px', color: '#475569', fontSize: '0.9rem', maxWidth: '800px' }}>
              {project.description}
            </p>
          </div>

          {user?.role !== 'DEVELOPER' && (
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <Plus size={18} /> Add Task
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.875rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} /> Client: <strong style={{ color: '#0f172a' }}>{project.client?.name}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserIcon size={16} /> Manager: <strong style={{ color: '#0f172a' }}>{project.projectManager?.name}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} /> Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Project Task List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Project Tasks ({project.tasks?.length || 0})</h3>
        </div>
        <TaskTable
          tasks={project.tasks || []}
          onSelectTask={(task) => setSelectedTask(task)}
          onEditTask={(task) => setEditingTask(task)}
          onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
        />
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen || !!editingTask}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={async (formData) => {
          if (editingTask) {
            await updateTaskMutation.mutateAsync({ id: editingTask.id, formData });
          } else {
            await createTaskMutation.mutateAsync(formData);
          }
        }}
        initialTask={editingTask}
        projects={[project]}
        developers={developers}
        defaultProjectId={project.id}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
      />
    </div>
  );
};
