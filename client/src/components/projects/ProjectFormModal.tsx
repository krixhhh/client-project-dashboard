import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Project, Client, User } from '../../types';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialProject?: Project | null;
  clients: Client[];
  projectManagers: User[];
  isAdmin: boolean;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
  clients,
  projectManagers,
  isAdmin,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description);
      setClientId(initialProject.clientId);
      setProjectManagerId(initialProject.projectManagerId);
    } else {
      setName('');
      setDescription('');
      setClientId(clients[0]?.id || '');
      setProjectManagerId(projectManagers[0]?.id || '');
    }
    setError('');
  }, [initialProject, isOpen, clients, projectManagers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !clientId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        name,
        description,
        clientId,
        ...(isAdmin && projectManagerId ? { projectManagerId } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProject ? 'Edit Project' : 'Create New Agency Project'}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            type="text"
            placeholder="e.g., Acme E-Commerce Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            rows={3}
            placeholder="High-level project scope and goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="form-select"
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company || 'Client'})
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div className="form-group">
            <label className="form-label">Assign Project Manager</label>
            <select
              value={projectManagerId}
              onChange={(e) => setProjectManagerId(e.target.value)}
              className="form-select"
            >
              {projectManagers.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name} ({pm.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : initialProject ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
