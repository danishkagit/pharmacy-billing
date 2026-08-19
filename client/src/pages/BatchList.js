import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable, GlassTabs } from '../components/ui';

export default function BatchList() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [stats, setStats] = useState({ total: 0, totalQty: 0 });

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    API.get('/batches', { params }).then(res => {
      if (res.success) { setBatches(res.data); setStats({ total: res.total, totalQty: res.totalQty }); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  const dayDiff = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

  const filteredBatches = batches.filter(b => {
    const days = dayDiff(b.expiryDate);
    const isExpiring = days <= 30 && days > 0;
    if (statusTab === 'all') return true;
    if (statusTab === 'active') return !b.isExpired && !isExpiring;
    if (statusTab === 'expired') return b.isExpired || days <= 0;
    if (statusTab === 'damaged') return b.isDamaged;
    return true;
  });

  const tabs = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'active', label: 'Active', icon: 'check-circle' },
    { key: 'expired', label: 'Expired', icon: 'times-circle' },
    { key: 'damaged', label: 'Damaged', icon: 'exclamation-triangle' },
  ];

  const columns = [
    {
      label: 'Medicine',
      className: 'text-left',
      tdClass: 'font-medium',
      render: row => row.medicine?.name || 'Unknown',
    },
    {
      label: 'Batch No',
      className: 'text-left',
      tdClass: 'text-gray-500',
      render: row => row.batchNo,
    },
    {
      label: 'Supplier',
      className: 'text-left hidden md:table-cell',
      tdClass: 'text-gray-500 hidden md:table-cell',
      render: row => row.supplier?.name || '-',
    },
    {
      label: 'Qty',
      className: 'text-center',
      tdClass: 'text-center font-medium',
      render: row => row.qty,
    },
    {
      label: 'MRP',
      className: 'text-center hidden md:table-cell',
      tdClass: 'text-center hidden md:table-cell',
      render: row => `₹${row.mrp}`,
    },
    {
      label: 'Expiry',
      className: 'text-center',
      tdClass: 'text-center',
      render: row => {
        const days = dayDiff(row.expiryDate);
        return (
          <>
            {new Date(row.expiryDate).toLocaleDateString('en-IN')}
            {days <= 30 && days > 0 && <span className="text-orange-600 text-xs ml-1">({days}d)</span>}
            {days <= 0 && <span className="text-red-600 text-xs ml-1">Expired</span>}
          </>
        );
      },
    },
    {
      label: 'Status',
      className: 'text-center',
      tdClass: 'text-center',
      render: row => {
        const days = dayDiff(row.expiryDate);
        let cls = 'badge-green';
        let label = 'Active';
        if (row.isExpired || days <= 0) { cls = 'badge-red'; label = 'Expired'; }
        else if (days <= 30) { cls = 'badge-yellow'; label = 'Expiring'; }
        return <span className={cls}>{label}</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader icon="boxes" title="Batches" subtitle="Stock batches with expiry tracking">
        <div className="text-sm text-gray-500">{stats.total} batches | {stats.totalQty} units in stock</div>
      </PageHeader>
      <GlassCard>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <input
            placeholder="Search by medicine name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input flex-1 min-w-[180px]"
          />
          <GlassTabs tabs={tabs} active={statusTab} onChange={setStatusTab} />
        </div>
        <GlassTable
          columns={columns}
          data={filteredBatches}
          loading={loading}
          emptyMessage="No batches found"
        />
      </GlassCard>
    </div>
  );
}
