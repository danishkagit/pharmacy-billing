import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function TransferList() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchTransfers = () => {
    setLoading(true);
    const params = { limit: 200 };
    if (status) params.status = status;
    API.get('/transfers', { params }).then(res => {
      if (res.success) setTransfers(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransfers(); }, [status]);

  const handleReceive = async (id) => {
    if (!window.confirm('Mark this transfer as received?')) return;
    try {
      const res = await API.put(`/transfers/${id}/receive`);
      if (res.success) fetchTransfers();
    } catch (err) { alert(err?.error || 'Failed to receive transfer'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inter-Branch Transfers</h1>
        <Link to="/transfers/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> New Transfer
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in_transit">In Transit</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : transfers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No transfers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Transfer No</th>
                  <th className="text-left p-3 font-medium">From Branch</th>
                  <th className="text-left p-3 font-medium">To Branch</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-center p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{t.transferNo}</td>
                    <td className="p-3">{t.fromBranch?.name || '-'}</td>
                    <td className="p-3">{t.toBranch?.name || '-'}</td>
                    <td className="p-3 text-gray-500">{new Date(t.transferDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-center">{t.totalItems || t.items?.length || 0}</td>
                    <td className="p-3 text-right font-medium">₹{(t.totalAmount || 0).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status?.replace('_', ' ')}</span>
                    </td>
                    <td className="p-3 text-center">
                      {(t.status === 'in_transit' || t.status === 'approved') ? (
                        <button onClick={() => handleReceive(t._id)} className="text-green-600 hover:underline text-xs font-medium">Receive</button>
                      ) : '-'}
                    </td>
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
