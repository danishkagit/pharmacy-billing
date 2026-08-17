export default function GlassCard({ children, className = '', hover = false, padding = true }) {
  const base = hover ? 'glass-card app-card-hover hover:' : 'glass-card';
  return (
    <div className={`${base} ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}