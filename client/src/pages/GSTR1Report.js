import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function GSTR1Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    API.get('/gst/gstr1', { params: { month, year } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const hsnColumns = [
    { label: 'GST Rate', render: h => `${h.gstRate}%` },
    { label: 'Qty', className: 'text-right', tdClass: 'text-right', render: h => h.qty },
    { label: 'Taxable', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.taxableValue?.toFixed(2)}` },
    { label: 'CGST', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.cgst?.toFixed(2)}` },
    { label: 'SGST', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.sgst?.toFixed(2)}` },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="GSTR-1 Report" subtitle="Outward supplies statement">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="glass-select w-36">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="glass-select w-28">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </PageHeader>
      <GlassCard>
        {loading ? (
          <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500"></div></div>
        ) : data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
              <div className="app-card app-card-hover p-4 text-center"><p className="text-2xl font-bold text-blue-600">{data.summary.totalInvoices}</p><p className="text-sm text-slate-500">Total Invoices</p></div>
              <div className="app-card app-card-hover p-4 text-center"><p className="text-2xl font-bold text-purple-600">{data.b2b.length}</p><p className="text-sm text-slate-500">B2B</p></div>
              <div className="app-card app-card-hover p-4 text-center"><p className="text-2xl font-bold text-green-600">{data.b2c.length}</p><p className="text-sm text-slate-500">B2C</p></div>
            </div>
            <div className="text-right text-lg font-bold text-slate-700"><i className="fas fa-chart-line mr-1 text-pharma-500"></i>Total Sales: ₹{data.summary.totalSales?.toFixed(2)}</div>

            <h3 className="page-title !text-base">HSN Summary</h3>
            <GlassTable columns={hsnColumns} data={data.hsnSummary} loading={false} emptyMessage="No HSN data" />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
