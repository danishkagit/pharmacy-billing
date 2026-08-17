import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function PurchaseReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/purchase-returns', { params: { limit: 200 } }).then(res => {
      if (res.success) setReturns(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusBadge = { pending: 'badge-yellow', approved: 'badge-blue', completed: 'badge-green' };

  const columns = [
    { key: 'returnNo', label: 'Return No', tdClass: 'font-medium' },
    { label: 'Supplier', render: r => r.supplier?.name || '-' },
    { label: 'Date', render: r => new Date(r.returnDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Reason', render: r => <span className="capitalize">{r.reason}</span> },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right font-medium', render: r => `₹${r.totalAmount?.toFixed(2)}` },
    { label: 'Debit Note', className: 'text-center', tdClass: 'text-center', render: r => r.debitNoteNo || '-' },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: r => <span className={`badge ${statusBadge[r.status] || 'badge-gray'}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="undo" title="Purchase Returns" subtitle="Returns to suppliers">
        <Link to="/purchase-returns/new" className="btn btn-primary"><i className="fas fa-plus"></i> New Return</Link>
      </PageHeader>
      <GlassCard>
        <GlassTable columns={columns} data={returns} loading={loading} emptyMessage="No purchase returns yet" />
      </GlassCard>
    </div>
  );
}
