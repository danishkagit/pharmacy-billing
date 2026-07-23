import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function ProfitLossReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month');

  useEffect(() => {
    API.get('/reports/profit-loss', { params: { filter } }).then(res => {
      if (res.success) setData(res.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profit & Loss Statement</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-2 mb-6">
          {['today', 'week', 'month', 'year'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
          ))}
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : data && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex justify-between text-lg py-3 border-b"><span>Sales Revenue</span><span className="font-bold text-green-600">₹{data.totalSales?.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg py-3 border-b"><span>Cost of Goods (Purchases)</span><span className="font-bold text-red-600">-₹{data.totalPurchases?.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg py-3 border-b font-semibold"><span>Gross Profit</span><span className={data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>₹{data.grossProfit?.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg py-3 border-b"><span>Total Expenses</span><span className="font-bold text-red-600">-₹{data.totalExpenses?.toFixed(2)}</span></div>
            <div className={`flex justify-between text-xl py-4 border-t-2 font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Net Profit / Loss</span>
              <span>₹{data.netProfit?.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-400 text-center pt-2">{data.period?.start && `${new Date(data.period.start).toLocaleDateString('en-IN')} - ${new Date(data.period.end).toLocaleDateString('en-IN')}`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
