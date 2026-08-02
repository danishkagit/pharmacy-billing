export default function GlassCard({ children, className = '', hover = false, padding = true }) {
  const base = hover ? 'app-card app-card-hover' : 'app-card';
  return (
    <div className={`${base} ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
