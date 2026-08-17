import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', partyType: '', from: '', to: '' });

  useEffect(() => {
    API.get('/payments', { params: filter }).then(res => {
      if (res.success) setPayments(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const columns = [
    { label: 'Date', render: p => new Date(p.paymentDate).toLocaleDateString('en-IN') },
    { label: 'Type', render: p => <span className={`badge ${p.type === 'receipt' ? 'badge-green' : 'badge-red'}`}>{p.type}</span> },
    { label: 'Party', render: p => p.partyName || p.party || '-' },
    { label: 'Mode', render: p => <span className="capitalize">{p.mode}</span> },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right font-medium', render: p => `₹${p.amount?.toFixed(2)}` },
    { label: 'Reference', render: p => p.reference || p.transactionId || '-', tdClass: 'text-slate-500' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="rupee-sign" title="Payments" subtitle="Receive and pay party amounts" />
      <GlassCard>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="glass-select w-40"><option value="">All</option><option value="receipt">Receipts</option><option value="payment">Payments</option></select>
          <select value={filter.partyType} onChange={e => setFilter({ ...filter, partyType: e.target.value })} className="glass-select w-44"><option value="">All Parties</option><option value="customer">Customer</option><option value="supplier">Supplier</option></select>
          <input type="date" value={filter.from} onChange={e => setFilter({ ...filter, from: e.target.value })} className="glass-input w-44" />
          <input type="date" value={filter.to} onChange={e => setFilter({ ...filter, to: e.target.value })} className="glass-input w-44" />
        </div>
        <GlassTable columns={columns} data={payments} loading={loading} emptyMessage="No payments found" />
      </GlassCard>
    </div>
  );
}
