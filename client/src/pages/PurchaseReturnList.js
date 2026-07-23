import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function PurchaseReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/purchase-returns', { params: { limit: 200 } }).then(res => {
      if (res.success) setReturns(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Returns</h1>
        <Link to="/purchase-returns/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> New Return
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : returns.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No purchase returns yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Return No</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Reason</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-center p-3 font-medium">Debit Note</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.returnNo}</td>
                    <td className="p-3">{r.supplier?.name || '-'}</td>
                    <td className="p-3 text-gray-500">{new Date(r.returnDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 capitalize">{r.reason}</td>
                    <td className="p-3 text-right font-medium">₹{r.totalAmount?.toFixed(2)}</td>
                    <td className="p-3 text-center">{r.debitNoteNo || '-'}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span></td>
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
