import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function CreditNoteList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  useEffect(() => {
    if (type === 'debit') {
      API.get('/purchase-returns', { params: { limit: 200 } }).then(res => {
        if (res.success) setReturns(res.data.map(r => ({ ...r, docType: 'debit' })));
      }).catch(console.error).finally(() => setLoading(false));
    } else {
      API.get('/sale-returns', { params: { limit: 200 } }).then(res => {
        if (res.success) setReturns(res.data.map(r => ({ ...r, docType: 'credit' })));
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Credit / Debit Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all return-related financial documents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setType('')} className={`px-4 py-2 rounded-lg text-sm font-medium ${!type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Credit Notes</button>
          <button onClick={() => setType('debit')} className={`px-4 py-2 rounded-lg text-sm font-medium ${type === 'debit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Debit Notes</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : returns.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No {type === 'debit' ? 'debit' : 'credit'} notes found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Note No</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Party</th>
                  <th className="text-left p-3 font-medium">Return Ref</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.docType === 'debit' ? (r.debitNoteNo || r.returnNo) : (r.creditNoteNo || r.returnNo)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.docType === 'debit' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {r.docType === 'debit' ? 'Debit Note' : 'Credit Note'}
                      </span>
                    </td>
                    <td className="p-3">{r.customer?.name || r.supplier?.name || '-'}</td>
                    <td className="p-3 text-gray-500">{r.returnNo}</td>
                    <td className="p-3 text-gray-500">{new Date(r.returnDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right font-medium">₹{r.totalAmount?.toFixed(2)}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
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
