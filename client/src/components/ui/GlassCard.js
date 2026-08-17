export default function GlassCard({ children, className = '', hover = false, padding = true, accent = false }) {
  const base = hover ? 'glass-card app-card-hover hover:' : 'glass-card';
  return (
    <div className={`${base} ${accent ? 'grad-edge' : ''} ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}