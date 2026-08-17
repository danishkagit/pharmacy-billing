import { useState, useEffect } from 'react';
import API, { API_BASE } from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function ExpiryDashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(60);

  useEffect(() => {
    API.get('/batches/expiry-report', { params: { days } }).then(res => {
      if (res.success) setBatches(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [days]);

  const columns = [
    { label: 'Medicine', render: b => b.medicineName, tdClass: 'font-medium' },
    { label: 'Manufacturer', render: b => b.manufacturer || '-', tdClass: 'text-slate-500' },
    { label: 'Batch', render: b => b.batchNo, tdClass: 'text-slate-500' },
    { label: 'Qty', className: 'text-center', tdClass: 'text-center', render: b => b.qty },
    { label: 'MRP', className: 'text-center', tdClass: 'text-center', render: b => `₹${b.mrp}` },
    { label: 'Expiry', className: 'text-center', tdClass: 'text-center', render: b => new Date(b.expiryDate).toLocaleDateString('en-IN') },
    { label: 'Days Left', className: 'text-center', tdClass: 'text-center', render: b => <span className={`font-bold ${b.daysRemaining <= 30 ? 'text-red-600' : b.daysRemaining <= 60 ? 'text-orange-600' : 'text-yellow-600'}`}>{b.daysRemaining}</span> },
    { label: 'Location', render: b => b.location || '-', tdClass: 'text-slate-500' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="clock" title="Expiry Dashboard" subtitle={`${batches.length} batch(es) expiring within ${days} days`}>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white/60 backdrop-blur-md rounded-xl p-1 gap-0.5 shadow-sm border border-white/70">
            {[30, 60, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${days === d ? 'bg-white text-pharma-700 shadow glow-soft' : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'}`}>{d} days</button>
            ))}
          </div>
          <button onClick={() => window.open(`${API_BASE}/batches/expiry-report/pdf?days=${days}`, '_blank')} className="btn btn-secondary">
            <i className="fas fa-file-pdf mr-1 text-red-500"></i>Download PDF
          </button>
        </div>
      </PageHeader>
      <GlassCard>
        <GlassTable columns={columns} data={batches} loading={loading} emptyMessage={<>No items expiring within {days} days</>} />
      </GlassCard>
    </div>
  );
}
