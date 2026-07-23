import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function PurchaseOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { limit: 200 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    API.get('/purchase-orders', { params }).then(res => {
      if (res.success) setOrders(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
        <Link to="/purchase-orders/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> New Purchase Order
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input placeholder="Search by supplier name..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No purchase orders found. <Link to="/purchase-orders/new" className="text-blue-600 hover:underline">Create one</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">PO No</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-center p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(po => (
                  <tr key={po._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{po.poNo}</td>
                    <td className="p-3">{po.supplier?.name || 'Unknown'}</td>
                    <td className="p-3 text-gray-500">{new Date(po.orderDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-center">{po.items?.length || 0}</td>
                    <td className="p-3 text-right font-medium">₹{(po.totalAmount || 0).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[po.status] || 'bg-gray-100 text-gray-700'}`}>{po.status}</span>
                    </td>
                    <td className="p-3 text-center">
                      <Link to={`/purchase-orders/${po._id}`} className="text-blue-600 hover:underline text-xs mr-2">View</Link>
                      {po.status !== 'cancelled' && po.status !== 'received' && (
                        <button onClick={() => { if (window.confirm('Cancel this PO?')) API.delete(`/purchase-orders/${po._id}`).then(() => setOrders(prev => prev.map(x => x._id === po._id ? { ...x, status: 'cancelled' } : x))); }} className="text-red-500 hover:underline text-xs">Cancel</button>
                      )}
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
