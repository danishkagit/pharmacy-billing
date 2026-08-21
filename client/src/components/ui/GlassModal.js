import React, { useEffect } from 'react';

export default function GlassModal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizes[size] || sizes.md} glass-card surface-glass-strong max-h-[90vh] flex flex-col animate-scale-in p-0 overflow-hidden shadow-2xl border border-slate-200 bg-white`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full grad-brand inline-block"></span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 crx-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}