import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable, GlassTabs } from '../components/ui';

const STATUS_COLORS = {
  draft: 'badge-gray',
  pending: 'badge-yellow',
  approved: 'badge-blue',
  in_transit: 'badge-orange',
  received: 'badge-green',
  cancelled: 'badge-red'
};

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'received', label: 'Received' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function TransferList() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchTransfers = () => {
    setLoading(true);
    const params = { limit: 200 };
    if (status) params.status = status;
    API.get('/transfers', { params }).then(res => {
      if (res.success) setTransfers(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransfers(); }, [status]);

  const handleReceive = async (id) => {
    if (!window.confirm('Mark this transfer as received?')) return;
    try {
      const res = await API.put(`/transfers/${id}/receive`);
      if (res.success) fetchTransfers();
    } catch (err) { alert(err?.error || 'Failed to receive transfer'); }
  };

  const columns = [
    { key: 'transferNo', label: 'Transfer No', tdClass: 'font-medium' },
    { label: 'From Branch', render: t => t.fromBranch?.name || '-' },
    { label: 'To Branch', render: t => t.toBranch?.name || '-' },
    { label: 'Date', render: t => new Date(t.transferDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Items', className: 'text-center', tdClass: 'text-center', render: t => t.totalItems || t.items?.length || 0 },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right font-medium', render: t => `₹${(t.totalAmount || 0).toFixed(2)}` },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: t => <span className={`badge ${STATUS_COLORS[t.status] || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span> },
    {
      label: 'Actions', className: 'text-center', tdClass: 'text-center',
      render: t => (t.status === 'in_transit' || t.status === 'approved')
        ? <button onClick={() => handleReceive(t._id)} className="btn btn-sm btn-success"><i className="fas fa-check mr-1"></i>Receive</button>
        : '-',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Inter-Branch Transfers" subtitle="Move stock between branches">
        <Link to="/transfers/new" className="btn btn-primary"><i className="fas fa-plus"></i> New Transfer</Link>
      </PageHeader>
      <GlassCard>
        <GlassTabs tabs={TABS} active={status} onChange={setStatus} />
        <div className="mt-4">
          <GlassTable columns={columns} data={transfers} loading={loading} emptyMessage="No transfers found" />
        </div>
      </GlassCard>
    </div>
  );
}
