import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          403 - Access Forbidden
        </h2>
        <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '24px' }}>
          You do not have permission to access this resource or perform this action. Permission checks are strictly enforced by the backend API.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};
