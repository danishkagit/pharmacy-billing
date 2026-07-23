export default function GlassCard({ children, className = '', hover = false, padding = true }) {
  const base = hover ? 'glass-card-hover' : 'glass-card-solid';
  return (
    <div className={`${base} ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
