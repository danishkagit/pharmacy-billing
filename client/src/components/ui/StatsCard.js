export default function StatsCard({ icon, iconBg, label, value, sub, trend }) {
  return (
    <div className="glass-card app-card-hover p-5 flex items-start gap-4 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-focus-100/40 rounded-full blur-2xl"></div>
      <div className="w-11 h-11 rounded-xl grad-accent-soft flex items-center justify-center flex-shrink-0 border border-white/60 shadow-sm" style={{ background: iconBg || 'linear-gradient(135deg, rgba(20,163,148,0.14), rgba(99,102,241,0.1))' }}>
        <i className={`fas fa-${icon}`} style={{ color: iconBg ? (typeof iconBg === 'string' && iconBg.startsWith('#') ? iconBg : '#0ea296') : '#0ea296' }}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 mt-0.5 leading-tight tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        {trend !== undefined && (
          <span className={`text-[11px] font-semibold ${trend >= 0 ? 'text-pharma-600' : 'text-red-500'}`}>
            <i className={`fas fa-${trend >= 0 ? 'arrow-up' : 'arrow-down'} mr-0.5`}></i>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}