import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable, GlassTabs } from '../components/ui';

const statusBadge = {
  draft: 'badge-gray',
  pending: 'badge-yellow',
  approved: 'badge-blue',
  received: 'badge-green',
  cancelled: 'badge-red'
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

  const tabs = [
    { key: '', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'received', label: 'Received' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const columns = [
    { key: 'poNo', label: 'PO No', tdClass: 'font-medium' },
    { label: 'Supplier', render: po => po.supplier?.name || 'Unknown' },
    { label: 'Date', render: po => new Date(po.orderDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Items', className: 'text-center', tdClass: 'text-center', render: po => po.items?.length || 0 },
    { label: 'Total', className: 'text-right', tdClass: 'text-right font-medium', render: po => `₹${(po.totalAmount || 0).toFixed(2)}` },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: po => <span className={`badge ${statusBadge[po.status] || 'badge-gray'}`}>{po.status}</span> },
    {
      label: 'Actions', className: 'text-center', tdClass: 'text-center',
      render: po => (
        <>
          <Link to={`/purchase-orders/${po._id}`} className="btn btn-ghost btn-sm text-pharma-600">View</Link>
          {po.status !== 'cancelled' && po.status !== 'received' && (
            <button onClick={() => { if (window.confirm('Cancel this PO?')) API.delete(`/purchase-orders/${po._id}`).then(() => setOrders(prev => prev.map(x => x._id === po._id ? { ...x, status: 'cancelled' } : x))); }} className="btn btn-ghost btn-sm text-red-400 hover:text-red-500">Cancel</button>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="clipboard-list" title="Purchase Orders" subtitle="Procurement orders to suppliers">
        <Link to="/purchase-orders/new" className="btn btn-primary"><i className="fas fa-plus"></i> New Purchase Order</Link>
      </PageHeader>
      <GlassCard>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input placeholder="Search by supplier name..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input flex-1 min-w-[220px]" />
          <GlassTabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />
        </div>
        <GlassTable columns={columns} data={orders} loading={loading} emptyMessage={<>No purchase orders found. <Link to="/purchase-orders/new" className="text-pharma-600 font-medium hover:underline">Create one</Link></>} />
      </GlassCard>
    </div>
  );
}
