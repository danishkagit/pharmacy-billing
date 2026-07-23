import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function BatchList() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterExpiring, setFilterExpiring] = useState('');
  const [stats, setStats] = useState({ total: 0, totalQty: 0 });

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (filterExpiring) params.expiring = filterExpiring;
    API.get('/batches', { params }).then(res => {
      if (res.success) { setBatches(res.data); setStats({ total: res.total, totalQty: res.totalQty }); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, filterExpiring]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Batch Stock</h1>
        <div className="text-sm text-gray-500">{stats.total} batches | {stats.totalQty} units in stock</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input placeholder="Search by medicine name..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={filterExpiring} onChange={e => setFilterExpiring(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Stock</option>
            <option value="30">Expiring in 30 days</option>
            <option value="60">Expiring in 60 days</option>
            <option value="90">Expiring in 90 days</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Medicine</th>
                  <th className="text-left p-3 font-medium">Batch No</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-center p-3 font-medium">Qty</th>
                  <th className="text-center p-3 font-medium">MRP</th>
                  <th className="text-center p-3 font-medium">Expiry</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map(b => {
                  const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={b._id} className={`hover:bg-gray-50 ${days <= 30 && days > 0 ? 'bg-orange-50' : ''} ${days <= 0 ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-medium">{b.medicine?.name || 'Unknown'}</td>
                      <td className="p-3 text-gray-500">{b.batchNo}</td>
                      <td className="p-3 text-gray-500">{b.supplier?.name || '-'}</td>
                      <td className="p-3 text-center font-medium">{b.qty}</td>
                      <td className="p-3 text-center">₹{b.mrp}</td>
                      <td className="p-3 text-center">{new Date(b.expiryDate).toLocaleDateString('en-IN')} {days <= 30 && days > 0 && <span className="text-orange-600 text-xs">({days}d)</span>}{days <= 0 && <span className="text-red-600 text-xs">Expired</span>}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.isExpired ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {b.isExpired ? 'Expired' : days <= 30 ? 'Expiring' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
