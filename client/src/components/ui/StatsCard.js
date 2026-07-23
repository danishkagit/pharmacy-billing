import GlassCard from './GlassCard';

export default function StatsCard({ icon, iconBg, label, value, sub, trend }) {
  return (
    <GlassCard className="stats-card">
      <div className="stats-icon" style={{ background: iconBg || 'rgba(99,102,241,0.1)', color: iconBg || '#6366f1' }}>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-pharma-600' : 'text-red-500'}`}>
            <i className={`fas fa-${trend >= 0 ? 'arrow-up' : 'arrow-down'} mr-0.5`}></i>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </GlassCard>
  );
}
