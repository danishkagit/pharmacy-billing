import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', partyType: '', from: '', to: '' });

  useEffect(() => {
    API.get('/payments', { params: filter }).then(res => {
      if (res.success) setPayments(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payments</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="">All</option><option value="receipt">Receipts</option><option value="payment">Payments</option></select>
          <select value={filter.partyType} onChange={e => setFilter({ ...filter, partyType: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none"><option value="">All Parties</option><option value="customer">Customer</option><option value="supplier">Supplier</option></select>
          <input type="date" value={filter.from} onChange={e => setFilter({ ...filter, from: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <input type="date" value={filter.to} onChange={e => setFilter({ ...filter, to: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Party</th>
                  <th className="text-left p-3 font-medium">Mode</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${p.type === 'receipt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.type}</span></td>
                    <td className="p-3">{p.partyName || p.party || '-'}</td>
                    <td className="p-3 capitalize">{p.mode}</td>
                    <td className="p-3 text-right font-medium">₹{p.amount?.toFixed(2)}</td>
                    <td className="p-3 text-gray-500">{p.reference || p.transactionId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
