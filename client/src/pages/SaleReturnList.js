import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function SaleReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/sale-returns', { params: { limit: 200 } }).then(res => {
      if (res.success) setReturns(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusBadge = { pending: 'badge-yellow', approved: 'badge-blue', completed: 'badge-green' };

  const columns = [
    { key: 'returnNo', label: 'Return No', tdClass: 'font-medium' },
    { label: 'Customer', render: r => r.customer?.name || '-' },
    { label: 'Sale Invoice', render: r => r.saleInvoice?.invoiceNo || '-', tdClass: 'text-slate-500' },
    { label: 'Date', render: r => new Date(r.returnDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Reason', render: r => <span className="capitalize">{r.reason?.replace(/_/g, ' ')}</span> },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right font-medium', render: r => `₹${r.totalAmount?.toFixed(2)}` },
    { label: 'Credit Note', className: 'text-center', tdClass: 'text-center', render: r => r.creditNoteNo || '-' },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: r => <span className={`badge ${statusBadge[r.status] || 'badge-gray'}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="rotate-left" title="Sale Returns" subtitle="Returns from customers">
        <Link to="/sale-returns/new" className="btn btn-primary"><i className="fas fa-plus"></i> New Return</Link>
      </PageHeader>
      <GlassCard>
        <GlassTable columns={columns} data={returns} loading={loading} emptyMessage="No sale returns yet" />
      </GlassCard>
    </div>
  );
}
