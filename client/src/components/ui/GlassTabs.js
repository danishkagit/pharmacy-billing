import React from 'react';

export default function GlassTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex max-w-full flex-wrap bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700 shadow-inner">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
            active === tab.key
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          {tab.icon && <i className={`fas fa-${tab.icon} text-[11px]`}></i>}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              active === tab.key ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' : 'bg-slate-300/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}