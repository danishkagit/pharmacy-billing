import { useEffect } from 'react';

export default function GlassModal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full ${sizes[size]} glass-card surface-glass-strong shadow-modal max-h-[85vh] flex flex-col animate-scale-in p-0`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/60 bg-gradient-to-r from-pharma-50/80 via-white/60 to-focus-50/80">
          <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full grad-brand inline-block"></span>
            {title}
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500"><i className="fas fa-times text-sm"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}