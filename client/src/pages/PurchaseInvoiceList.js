import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function PurchaseInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    API.get('/purchase-invoices', { params }).then(res => {
      if (res.success) setInvoices(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [from, to]);

  const statusBadge = { paid: 'badge-green', partial: 'badge-yellow', unpaid: 'badge-red', pending: 'badge-red' };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', tdClass: 'font-medium' },
    { label: 'Supplier', render: inv => inv.supplier?.name || 'Unknown' },
    { label: 'Date', render: inv => new Date(inv.invoiceDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right font-medium', render: inv => `₹${inv.totalAmount?.toFixed(2)}` },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: inv => <span className={`badge ${statusBadge[inv.paymentStatus] || 'badge-gray'}`}>{inv.paymentStatus}</span> },
    { label: 'Actions', className: 'text-center', tdClass: 'text-center', render: inv => (
      <button onClick={() => alert(JSON.stringify(inv, null, 2))} className="btn btn-ghost btn-sm text-pharma-600">View</button>
    ) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Purchase Invoices" subtitle="Bills received from suppliers">
        <Link to="/purchases/new" className="btn btn-primary"><i className="fas fa-plus"></i> New Purchase</Link>
      </PageHeader>
      <GlassCard>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="glass-input w-44" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="glass-input w-44" />
        </div>
        <GlassTable columns={columns} data={invoices} loading={loading} emptyMessage="No purchase invoices found" />
      </GlassCard>
    </div>
  );
}
