import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <FileQuestion size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          404 - Page Not Found
        </h2>
        <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '24px' }}>
          The requested page does not exist or has been moved.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};
