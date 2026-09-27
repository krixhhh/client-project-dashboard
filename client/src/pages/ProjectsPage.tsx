import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Project, Client, User } from '../types';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { Skeleton } from '../components/common/Skeleton';
import { Plus, FolderKanban, User as UserIcon, Building2, ChevronRight, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data;
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients');
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
    enabled: user?.role === 'ADMIN',
  });

  const projectManagers = users.filter((u) => u.role === 'PROJECT_MANAGER' || u.role === 'ADMIN');

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await api.post('/projects', formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: any }) => {
      const res = await api.patch(`/projects/${id}`, formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleFormSubmit = async (formData: any) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Projects Directory</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {user?.role === 'ADMIN' ? 'All Active Agency Projects' : 'Projects Under Management'}
          </p>
        </div>

        {user?.role !== 'DEVELOPER' && (
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3">
          <Skeleton height="160px" />
          <Skeleton height="160px" />
          <Skeleton height="160px" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          No projects available.
        </div>
      ) : (
        <div className="grid grid-cols-3" style={{ gap: '20px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderKanban size={20} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckSquare size={12} /> {project._count?.tasks || 0} Tasks
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {project.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '16px' }}>
                  {project.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={14} /> Client:
                  </span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{project.client?.name || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <UserIcon size={14} /> PM:
                  </span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{project.projectManager?.name || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', color: '#2563eb', fontWeight: 600, fontSize: '0.8rem', alignItems: 'center', gap: '2px' }}>
                  View Project <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialProject={editingProject}
        clients={clients}
        projectManagers={projectManagers}
        isAdmin={user?.role === 'ADMIN'}
      />
    </div>
  );
};
