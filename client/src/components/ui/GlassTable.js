import GlassCard from './GlassCard';

export default function GlassTable({ columns, data, onRowClick, loading, emptyMessage = 'No data found' }) {
  if (loading) {
    return (
      <GlassCard className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-sm text-gray-400 mt-3">Loading...</p>
      </GlassCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <i className="fas fa-inbox text-3xl text-gray-300 mb-2"></i>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-wrap">
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
