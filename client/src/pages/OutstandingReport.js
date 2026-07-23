import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function OutstandingReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/reports/outstanding', { params: { type: 'receivable' } }).then(res => {
      if (res.success) setData(res.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Outstanding Receivables</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : data ? (
          <div>
            <div className="text-right text-lg font-bold mb-4 text-red-600">Total Outstanding: ₹{data.totalReceivable?.toFixed(2)}</div>
            {data.receivable?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Invoice</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Paid</th>
                      <th className="p-2 text-right font-bold text-red-600">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.receivable.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium">{r.party?.name || r.partyName || '-'}</td>
                        <td className="p-2">{r.invoiceNo}</td>
                        <td className="p-2 text-gray-500">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                        <td className="p-2 text-right">₹{r.total?.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{(r.paid || 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-red-600">₹{(r.due || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-center text-gray-400 py-8">No outstanding amounts</p>}
          </div>
        ) : <p className="text-center text-gray-400 py-8">No data</p>}
      </div>
    </div>
  );
}
