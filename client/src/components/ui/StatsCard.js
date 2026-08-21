import React from 'react';

export default function StatsCard({ icon, iconBg, label, value, sub, trend, accent }) {
  const grad = accent || 'grad-brand';
  return (
    <div className="glass-card app-card-hover p-4 lg:p-5 flex items-start gap-3.5 relative overflow-hidden bg-white/95 dark:bg-slate-900/90">
      <div className={`color-block color-block-md ${grad} text-white flex-shrink-0 shadow-sm`}>
        <i className={`fas fa-${icon} text-sm`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 leading-tight tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">{sub}</p>}
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-1 ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            <i className={`fas fa-${trend >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}`}></i>
            {Math.abs(trend)}% vs last month
          </span>
        )}
      </div>
    </div>
  );
}