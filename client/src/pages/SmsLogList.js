import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

const STATUS_COLORS = {
  sent: 'badge-blue',
  delivered: 'badge-green',
  failed: 'badge-red',
  pending: 'badge-yellow'
};

const TYPE_OPTIONS = ['', 'receipt', 'invoice', 'reminder', 'otp', 'promotional', 'loyalty', 'delivery', 'prescription', 'other'];

export default function SmsLogList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ type: '', from: '', to: '' });

  useEffect(() => {
    setLoading(true);
    API.get('/sms/logs', { params: { ...filter, page, limit: 20 } }).then(res => {
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pages || 1);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter, page]);

  const columns = [
    { key: 'recipient', label: 'Recipient', tdClass: 'font-medium' },
    { label: 'Type', render: log => <span className="badge badge-gray capitalize">{log.type}</span> },
    { label: 'Channel', className: 'text-center', tdClass: 'text-center', render: log => log.channel === 'whatsapp' ? <i className="fab fa-whatsapp text-green-500 text-lg" title="WhatsApp"></i> : <i className="fas fa-sms text-blue-500 text-lg" title="SMS"></i> },
    { label: 'Message', render: log => log.message, tdClass: 'text-slate-500 max-w-xs truncate' },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: log => <span className={`badge ${STATUS_COLORS[log.status] || 'badge-gray'}`}>{log.status}</span> },
    { label: 'Date', render: log => new Date(log.createdAt || log.date).toLocaleString('en-IN'), tdClass: 'text-slate-500' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="SMS / WhatsApp Logs" subtitle="Outbound messaging history" />
      <GlassCard>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select value={filter.type} onChange={e => { setFilter({ ...filter, type: e.target.value }); setPage(1); }} className="glass-select w-44">
            <option value="">All Types</option>
            {TYPE_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input type="date" value={filter.from} onChange={e => { setFilter({ ...filter, from: e.target.value }); setPage(1); }} className="glass-input w-44" />
          <input type="date" value={filter.to} onChange={e => { setFilter({ ...filter, to: e.target.value }); setPage(1); }} className="glass-input w-44" />
        </div>
        <GlassTable columns={columns} data={logs} loading={loading} emptyMessage={<>No logs found</>} />
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm"><i className="fas fa-chevron-left mr-1"></i>Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">Next<i className="fas fa-chevron-right ml-1"></i></button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
