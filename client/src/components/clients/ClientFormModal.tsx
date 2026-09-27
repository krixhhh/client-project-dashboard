import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Client } from '../../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialClient?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialClient,
}) => {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialClient) {
      setName(initialClient.name);
      setContactEmail(initialClient.contactEmail);
      setContactPhone(initialClient.contactPhone || '');
      setCompany(initialClient.company || '');
    } else {
      setName('');
      setContactEmail('');
      setContactPhone('');
      setCompany('');
    }
    setError('');
  }, [initialClient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) {
      setError('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({ name, contactEmail, contactPhone, company });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClient ? 'Edit Client Record' : 'Register New Client'}
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
          <label className="form-label">Client Name *</label>
          <input
            type="text"
            placeholder="e.g., Acme Corporation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contact Email *</label>
          <input
            type="email"
            placeholder="contact@acme.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="text"
              placeholder="+1-555-0192"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company / Organization</label>
            <input
              type="text"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : initialClient ? 'Update Client' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
