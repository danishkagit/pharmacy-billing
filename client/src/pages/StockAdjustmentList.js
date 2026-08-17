import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

const typeBadge = {
  write_off: 'badge-red',
  damage: 'badge-orange',
  physical_count: 'badge-blue',
  theft: 'badge-purple',
  return_to_supplier: 'badge-purple',
  other: 'badge-gray'
};

const statusBadge = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

export default function StockAdjustmentList() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/inventory/adjustments', { params: { limit: 200 } }).then(res => {
      if (res.success) setAdjustments(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'adjustmentNo', label: 'Adjustment No', tdClass: 'font-medium' },
    { label: 'Type', render: a => <span className={`badge ${typeBadge[a.type] || 'badge-gray'}`}>{a.type?.replace(/_/g, ' ')}</span> },
    { label: 'Items', render: a => `${a.items?.length || 0} item(s)` },
    { label: 'Total Amount', className: 'text-right', tdClass: 'text-right font-medium', render: a => `₹${(a.totalAmount || 0).toFixed(2)}` },
    { label: 'Reason', render: a => <span className="capitalize">{a.reason?.replace(/_/g, ' ') || '-'}</span> },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: a => <span className={`badge ${statusBadge[a.status] || 'badge-gray'}`}>{a.status}</span> },
    { label: 'Date', render: a => new Date(a.createdAt || a.date).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Stock Adjustments" subtitle="Inventory corrections and counts">
        <Link to="/stock-adjustments/new" className="btn btn-primary"><i className="fas fa-plus"></i> New Adjustment</Link>
      </PageHeader>
      <GlassCard>
        <GlassTable columns={columns} data={adjustments} loading={loading} emptyMessage="No stock adjustments yet" />
      </GlassCard>
    </div>
  );
}