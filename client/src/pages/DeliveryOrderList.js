import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function DeliveryOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusColors = { pending: 'bg-yellow-100 text-yellow-700', assigned: 'bg-blue-100 text-blue-700', in_transit: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  useEffect(() => {
    API.get('/delivery').then(res => { if (res.success) setOrders(res.data); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await API.put(`/delivery/${id}`, { status });
      if (res.success) setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch (err) { alert(err?.error || 'Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Delivery Orders</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : orders.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No delivery orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">DO No</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Address</th>
                  <th className="text-left p-3 font-medium">Assigned To</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{o.doNo}</td>
                    <td className="p-3">{o.customerName}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{o.deliveryAddress}</td>
                    <td className="p-3">{o.assignedToName || '-'}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status]}`}>{o.status?.replace('_', ' ')}</span></td>
                    <td className="p-3 text-right font-medium">₹{o.totalAmount?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <select onChange={e => updateStatus(o._id, e.target.value)} value={o.status} className="text-xs px-2 py-1 border rounded">
                        <option value="pending">Pending</option>
                        <option value="assigned">Assign</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancel</option>
                      </select>
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
