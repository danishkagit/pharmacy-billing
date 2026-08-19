import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function ProfitLossReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month');

  useEffect(() => {
    API.get('/reports/profit-loss', { params: { filter } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const FILTERS = ['today', 'week', 'month', 'year'];

  return (
    <div className="space-y-5">
      <PageHeader icon="chart-bar" title="Profit & Loss Statement" subtitle="Financial performance summary">
        <div className="inline-flex max-w-full flex-wrap bg-white/60 backdrop-blur-md rounded-xl p-1 gap-0.5 shadow-sm border border-white/70">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap transition-all duration-200 ${filter === f ? 'bg-white text-pharma-700 shadow glow-soft' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'}`}>{f}</button>
          ))}
        </div>
      </PageHeader>
      <GlassCard>
        {loading ? (
          <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500"></div></div>
        ) : data && (
          <div className="max-w-xl mx-auto space-y-4 animate-fade-up">
            <div className="flex justify-between text-lg py-3 border-b border-slate-200"><span>Sales Revenue</span><span className="font-bold text-green-600">₹{data.totalSales?.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg py-3 border-b border-slate-200"><span>Cost of Goods (Purchases)</span><span className="font-bold text-red-600">-₹{data.totalPurchases?.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg py-3 border-b border-slate-200 font-semibold"><span>Gross Profit</span><span className={data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>₹{data.grossProfit?.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg py-3 border-b border-slate-200"><span>Total Expenses</span><span className="font-bold text-red-600">-₹{data.totalExpenses?.toFixed(2)}</span></div>
            <div className={`flex justify-between text-xl py-4 rounded-xl px-4 bg-white/60 border border-white/70 font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Net Profit / Loss</span>
              <span>₹{data.netProfit?.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-400 text-center pt-2">{data.period?.start && `${new Date(data.period.start).toLocaleDateString('en-IN')} - ${new Date(data.period.end).toLocaleDateString('en-IN')}`}</div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
