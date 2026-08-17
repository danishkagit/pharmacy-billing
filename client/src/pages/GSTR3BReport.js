import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function GSTR3BReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    API.get('/gst/gstr3b', { params: { month, year } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-5">
      <PageHeader title="GSTR-3B Report" subtitle="Monthly summary of outward supplies">
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
              <div className="app-card app-card-hover p-4 text-center"><p className="text-xl font-bold text-green-600">₹{data.sales?.totalTaxable?.toFixed(2)}</p><p className="text-sm text-slate-500">Sales Taxable</p></div>
              <div className="app-card app-card-hover p-4 text-center"><p className="text-xl font-bold text-blue-600">₹{data.sales?.totalTax?.toFixed(2)}</p><p className="text-sm text-slate-500">Output Tax</p></div>
              <div className="app-card app-card-hover p-4 text-center"><p className="text-xl font-bold text-purple-600">₹{data.purchases?.totalTax?.toFixed(2)}</p><p className="text-sm text-slate-500">Input Tax Credit</p></div>
            </div>
            <div className={`relative overflow-hidden p-6 rounded-2xl text-center border ${data.netTaxLiability >= 0 ? 'bg-red-50/70 border-red-200' : 'bg-green-50/70 border-green-200'}`}>
              <p className="text-sm text-slate-500 font-medium">Net Tax Liability (Output - Input Credit)</p>
              <p className={`text-3xl font-bold ${data.netTaxLiability >= 0 ? 'text-red-600' : 'text-green-600'}`}>₹{Math.abs(data.netTaxLiability || 0).toFixed(2)}</p>
              <span className={`badge mt-2 ${data.netTaxLiability >= 0 ? 'badge-red' : 'badge-green'}`}>{data.netTaxLiability >= 0 ? 'Payable' : 'Refundable'}</span>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
