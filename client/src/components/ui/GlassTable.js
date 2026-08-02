import GlassCard from './GlassCard';

export default function GlassTable({ columns, data, onRowClick, loading, emptyMessage = 'No data found' }) {
  if (loading) {
    return (
      <div className="app-card text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500 mx-auto"></div>
        <p className="text-sm text-slate-400 mt-3">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="app-card text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-inbox text-xl text-slate-300"></i>
        </div>
        <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="app-card overflow-hidden">
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
    </div>
  );
}
