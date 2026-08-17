import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function DrugScheduleLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState('');

  useEffect(() => {
    API.get('/compliance/schedule-logs', { params: { schedule: schedule || undefined, limit: 200 } }).then(res => {
      if (res.success) setLogs(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [schedule]);

  const scheduleBadge = { X: 'badge-red', H1: 'badge-orange', H: 'badge-yellow' };

  const columns = [
    { label: 'Date', render: l => new Date(l.dispensedAt).toLocaleDateString('en-IN') },
    { label: 'Medicine', render: l => l.medicineName || l.medicine?.name, tdClass: 'font-medium' },
    { label: 'Schedule', className: 'text-center', tdClass: 'text-center', render: l => <span className={`badge ${scheduleBadge[l.schedule] || 'badge-gray'}`}>{l.schedule}</span> },
    { label: 'Qty', className: 'text-right', tdClass: 'text-right', render: l => l.qtyDispensed },
    { key: 'patientName', label: 'Patient' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'prescriptionNo', label: 'Rx No' },
    { label: 'Dispensed By', render: l => l.dispensedBy?.name || '-' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Drug Compliance Logs" subtitle="Schedule H, H1 and X dispensing records" />
      <GlassCard>
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <select value={schedule} onChange={e => setSchedule(e.target.value)} className="glass-select w-44">
            <option value="">All Schedules</option>
            <option value="H">Schedule H</option>
            <option value="H1">Schedule H1</option>
            <option value="X">Schedule X</option>
          </select>
        </div>
        <GlassTable columns={columns} data={logs} loading={loading} emptyMessage="No compliance logs found" />
      </GlassCard>
    </div>
  );
}
