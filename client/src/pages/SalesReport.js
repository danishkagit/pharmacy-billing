import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function SalesReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month');

  useEffect(() => {
    API.get('/reports/sales', { params: { filter, groupBy: filter === 'month' ? 'month' : filter === 'day' ? 'day' : undefined } }).then(res => {
      if (res.success) { setData(res.data || []); setSummary(res.summary || null); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const FILTERS = ['today', 'week', 'month', 'year'];

  const columns = [
    { key: '_id', label: 'Period' },
    { label: 'Sales', className: 'text-right', tdClass: 'text-right', render: d => `₹${d.total?.toFixed(2)}` },
    { label: 'Tax', className: 'text-right', tdClass: 'text-right', render: d => `₹${d.tax?.toFixed(2)}` },
    { label: 'Count', className: 'text-right', tdClass: 'text-right', render: d => d.count },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="chart-pie" title="Sales Report" subtitle="Revenue trends by period">
        <div className="inline-flex max-w-full flex-wrap bg-white/60 backdrop-blur-md rounded-xl p-1 gap-0.5 shadow-sm border border-white/70">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap transition-all duration-200 ${filter === f ? 'bg-white text-pharma-700 shadow glow-soft' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'}`}>{f}</button>
          ))}
        </div>
      </PageHeader>
      <GlassCard>
        {loading ? (
          <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500"></div></div>
        ) : (
          <div className="space-y-5">
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
                <div className="app-card app-card-hover p-4 text-center"><p className="text-2xl font-bold text-pharma-600">₹{summary.totalSales?.toFixed(2)}</p><p className="text-sm text-slate-500">Total Sales</p></div>
                <div className="app-card app-card-hover p-4 text-center"><p className="text-2xl font-bold text-indigo-600">{summary.count}</p><p className="text-sm text-slate-500">Invoices</p></div>
                <div className="app-card app-card-hover p-4 text-center"><p className="text-2xl font-bold text-purple-600">₹{(summary.avgBill || 0).toFixed(2)}</p><p className="text-sm text-slate-500">Avg Bill</p></div>
              </div>
            )}
            {data.length > 0 && Array.isArray(data) && data[0]?._id && (
              <GlassTable columns={columns} data={data} loading={false} emptyMessage="No data" />
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
