import { useState, useEffect } from 'react';
import API from '../utils/api';

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales Report</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-2 mb-6">
          {['today', 'week', 'month', 'year'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
          ))}
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="space-y-4">
            {summary && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="text-2xl font-bold">₹{summary.totalSales?.toFixed(2)}</p><p className="text-sm text-gray-500">Total Sales</p></div>
                <div className="p-4 bg-green-50 rounded-lg text-center"><p className="text-2xl font-bold">{summary.count}</p><p className="text-sm text-gray-500">Invoices</p></div>
                <div className="p-4 bg-purple-50 rounded-lg text-center"><p className="text-2xl font-bold">₹{(summary.avgBill || 0).toFixed(2)}</p><p className="text-sm text-gray-500">Avg Bill</p></div>
              </div>
            )}
            {data.length > 0 && Array.isArray(data) && data[0]?._id && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Period</th>
                      <th className="p-2 text-right">Sales</th>
                      <th className="p-2 text-right">Tax</th>
                      <th className="p-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(d => (
                      <tr key={d._id}>
                        <td className="p-2">{d._id}</td>
                        <td className="p-2 text-right">₹{d.total?.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{d.tax?.toFixed(2)}</td>
                        <td className="p-2 text-right">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
