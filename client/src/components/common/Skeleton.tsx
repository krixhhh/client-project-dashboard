import React from 'react';

export const Skeleton: React.FC<{ height?: string; width?: string; className?: string }> = ({
  height = '20px',
  width = '100%',
  className = '',
}) => {
  return (
    <div
      className={`skeleton-item ${className}`}
      style={{
        height,
        width,
        backgroundColor: '#e2e8f0',
        borderRadius: '6px',
        animation: 'pulse 1.5s infinite ease-in-out',
      }}
    />
  );
};
