import React from 'react';
import GlassCard from './GlassCard';

export default function GlassTable({ columns, data, onRowClick, loading, emptyMessage = 'No records found' }) {
  if (loading) {
    return (
      <GlassCard className="text-center py-12 bg-white/95 dark:bg-slate-900/90">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 dark:border-slate-700 border-t-emerald-600 mx-auto"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3">Loading data…</p>
      </GlassCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <GlassCard className="text-center py-12 bg-white/95 dark:bg-slate-900/90">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
          <i className="fas fa-inbox text-lg"></i>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{emptyMessage}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden !p-0 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="app-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={col.className}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
                {columns.map((col, ci) => (
                  <td key={ci} className={col.tdClass}>
                    {col.render ? col.render(row, ri) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}