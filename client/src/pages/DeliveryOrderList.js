import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function DeliveryOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusBadge = { pending: 'badge-yellow', assigned: 'badge-blue', in_transit: 'badge-purple', delivered: 'badge-green', cancelled: 'badge-red' };

  useEffect(() => {
    API.get('/delivery').then(res => { if (res.success) setOrders(res.data); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await API.put(`/delivery/${id}`, { status });
      if (res.success) setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch (err) { alert(err?.error || 'Failed'); }
  };

  const columns = [
    { key: 'doNo', label: 'DO No', tdClass: 'font-medium' },
    { label: 'Customer', key: 'customerName' },
    { label: 'Address', render: o => o.deliveryAddress, tdClass: 'text-slate-500 max-w-xs truncate' },
    { label: 'Assigned To', render: o => o.assignedToName || '-' },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: o => <span className={`badge ${statusBadge[o.status] || 'badge-gray'}`}>{o.status?.replace('_', ' ')}</span> },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right font-medium', render: o => `₹${o.totalAmount?.toFixed(2)}` },
    { label: 'Actions', className: 'text-center', tdClass: 'text-center', render: o => (
      <select onChange={e => updateStatus(o._id, e.target.value)} value={o.status} className="glass-select w-36 !py-1.5 text-xs">
        <option value="pending">Pending</option>
        <option value="assigned">Assign</option>
        <option value="in_transit">In Transit</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancel</option>
      </select>
    ) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="shipping-fast" title="Delivery Orders" subtitle="Track order fulfilment status" />
      <GlassCard>
        <GlassTable columns={columns} data={orders} loading={loading} emptyMessage="No delivery orders" />
      </GlassCard>
    </div>
  );
}
