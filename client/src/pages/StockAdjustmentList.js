import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const typeColors = {
  write_off: 'bg-red-100 text-red-700',
  damage: 'bg-orange-100 text-orange-700',
  physical_count: 'bg-blue-100 text-blue-700',
  theft: 'bg-purple-100 text-purple-700',
  return_to_supplier: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export default function StockAdjustmentList() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/inventory/adjustments', { params: { limit: 200 } }).then(res => {
      if (res.success) setAdjustments(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stock Adjustments</h1>
        <Link to="/stock-adjustments/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> New Adjustment
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : adjustments.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No stock adjustments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Adjustment No</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Total Amount</th>
                  <th className="text-left p-3 font-medium">Reason</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adjustments.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{a.adjustmentNo}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[a.type]}`}>{a.type?.replace(/_/g, ' ')}</span></td>
                    <td className="p-3">{a.items?.length || 0} item(s)</td>
                    <td className="p-3 text-right font-medium">₹{(a.totalAmount || 0).toFixed(2)}</td>
                    <td className="p-3 capitalize">{a.reason?.replace(/_/g, ' ') || '-'}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span></td>
                    <td className="p-3 text-gray-500">{new Date(a.createdAt || a.date).toLocaleDateString('en-IN')}</td>
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