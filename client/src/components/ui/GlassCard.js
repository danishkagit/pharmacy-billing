import React from 'react';

export default function GlassCard({ children, className = '', hover = false, padding = true, accent = false }) {
  const base = hover ? 'glass-card app-card-hover' : 'glass-card';
  return (
    <div className={`${base} ${accent ? 'grad-edge' : ''} ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}