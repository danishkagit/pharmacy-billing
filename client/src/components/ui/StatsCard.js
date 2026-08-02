export default function StatsCard({ icon, iconBg, label, value, sub, trend }) {
  return (
    <div className="app-card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg || 'rgba(13,148,136,0.1)' }}>
        <i className={`fas fa-${icon}`} style={{ color: iconBg ? undefined : '#0d9488' }}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <span className={`text-[11px] font-medium ${trend >= 0 ? 'text-pharma-600' : 'text-red-500'}`}>
            <i className={`fas fa-${trend >= 0 ? 'arrow-up' : 'arrow-down'} mr-0.5`}></i>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
