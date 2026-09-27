import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Task, Project, User, TaskStatus } from '../types';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { Skeleton } from '../components/common/Skeleton';
import { Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Construct query string from URL parameters
  const queryString = searchParams.toString();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', queryString],
    queryFn: async () => {
      const res = await api.get(`/tasks?${queryString}`);
      return res.data.data;
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data;
    },
    enabled: user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER',
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

  const tasks: Task[] = data?.tasks || [];
  const pagination = data?.pagination;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await api.post('/tasks', formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: any }) => {
      const res = await api.patch(`/tasks/${id}`, formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {user?.role === 'DEVELOPER' ? 'My Assigned Tasks' : 'Master Task Directory'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {user?.role === 'DEVELOPER' ? 'Tasks assigned directly to you' : 'Filter, assign, and manage team tasks'}
          </p>
        </div>

        {user?.role !== 'DEVELOPER' && (
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Create Task
          </button>
        )}
      </div>

      {/* URL Filter Bar */}
      <TaskFilterBar />

      {/* Task List */}
      {isLoading ? (
        <Skeleton height="300px" />
      ) : (
        <TaskTable
          tasks={tasks}
          onSelectTask={(task) => setSelectedTask(task)}
          onEditTask={(task) => setEditingTask(task)}
          onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
        />
      )}

      {/* Task Creation / Edit Modal */}
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
        projects={projects}
        developers={developers}
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
