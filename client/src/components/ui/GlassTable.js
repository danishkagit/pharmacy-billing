import GlassCard from './GlassCard';

export default function GlassTable({ columns, data, onRowClick, loading, emptyMessage = 'No data found' }) {
  if (loading) {
    return (
      <GlassCard className="text-center py-14">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500 mx-auto"></div>
        <p className="text-sm text-slate-400 mt-3">Loading...</p>
      </GlassCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <GlassCard className="text-center py-14">
        <div className="color-block color-block-lg grad-brand-soft text-pharma-500 mx-auto mb-3">
          <i className="fas fa-inbox text-xl"></i>
        </div>
        <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden !p-0">
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