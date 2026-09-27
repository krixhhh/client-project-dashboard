import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Client } from '../types';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { Skeleton } from '../components/common/Skeleton';
import { Building2, Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await api.post('/clients', formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: any }) => {
      const res = await api.patch(`/clients/${id}`, formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/clients/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleFormSubmit = async (formData: any) => {
    if (editingClient) {
      await updateMutation.mutateAsync({ id: editingClient.id, formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="#2563eb" /> Agency Client Accounts
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Manage client profiles, contact information, and project assignments
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} /> Register Client
        </button>
      </div>

      {isLoading ? (
        <Skeleton height="250px" />
      ) : clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          No registered clients found.
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Company</th>
                <th>Contact Email</th>
                <th>Contact Phone</th>
                <th>Projects</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.company || 'N/A'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                      <Mail size={14} /> {c.contactEmail}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                      <Phone size={14} /> {c.contactPhone || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-in-progress">
                      {c._count?.projects || 0} Projects
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingClient(c);
                              setIsModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Edit Client"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="btn btn-danger btn-sm"
                            title="Delete Client"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialClient={editingClient}
      />
    </div>
  );
};
