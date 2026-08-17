import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function AuditTrail() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/audit', { params: { limit: 100 } }).then(res => {
      if (res.success) setLogs(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!hasPermission('settings')) return (
    <div className="surface-glass p-10 text-center text-slate-500 animate-scale-in">
      <div className="w-14 h-14 rounded-2xl grad-accent-soft flex items-center justify-center mx-auto mb-3">
        <i className="fas fa-lock text-pharma-500"></i>
      </div>
      <p className="font-medium">Access restricted to admins</p>
    </div>
  );

  const columns = [
    { label: 'Timestamp', render: l => new Date(l.createdAt).toLocaleString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'User', render: l => l.userName || l.userId?.name || 'System', tdClass: 'font-medium' },
    {
      label: 'Action', render: l => {
        const map = { create: 'badge-green', update: 'badge-blue', delete: 'badge-red' };
        return <span className={`badge ${map[l.action] || 'badge-gray'}`}>{l.action}</span>;
      },
    },
    { label: 'Model', key: 'model', tdClass: 'captalize' },
    { label: 'Description', render: l => l.description || '-', tdClass: 'text-slate-500 max-w-xs truncate' },
    { label: 'IP', render: l => l.ip || '-', tdClass: 'text-slate-500' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Trail" subtitle="Security events and change history" />
      <GlassCard>
        <GlassTable columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found" />
      </GlassCard>
    </div>
  );
}
