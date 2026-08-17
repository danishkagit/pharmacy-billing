import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function OutstandingReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/reports/outstanding', { params: { type: 'receivable' } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { label: 'Customer', render: r => r.party?.name || r.partyName || '-', tdClass: 'font-medium' },
    { key: 'invoiceNo', label: 'Invoice' },
    { label: 'Date', render: r => new Date(r.date).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Total', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.total?.toFixed(2)}` },
    { label: 'Paid', className: 'text-right', tdClass: 'text-right', render: r => `₹${(r.paid || 0).toFixed(2)}` },
    { label: 'Due', className: 'text-right', tdClass: 'text-right font-bold text-red-600', render: r => `₹${(r.due || 0).toFixed(2)}` },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="hand-holding-usd" title="Outstanding Receivables" subtitle="Due amounts from customers">
        {data && <div className="text-lg font-bold text-red-600"><i className="fas fa-arrow-down mr-1"></i>₹{data.totalReceivable?.toFixed(2)}</div>}
      </PageHeader>
      <GlassCard>
        <GlassTable columns={columns} data={data?.receivable || []} loading={loading} emptyMessage="No outstanding amounts" />
      </GlassCard>
    </div>
  );
}
