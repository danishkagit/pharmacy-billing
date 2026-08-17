import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function NarcoticsRegister() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    API.get('/narcotics', { params: { from, to, limit: 200 } }).then(res => {
      if (res.success) setEntries(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [from, to]);

  const columns = [
    { label: 'Date', render: e => new Date(e.date).toLocaleDateString('en-IN') },
    { label: 'Medicine', render: e => e.medicineName || e.medicine?.name, tdClass: 'font-medium' },
    { label: 'Batch', render: e => e.batchNo || '-' },
    { label: 'Sold Qty', className: 'text-right', tdClass: 'text-right font-medium', render: e => e.soldQty },
    { label: 'Patient', key: 'patientName' },
    { label: 'Doctor', key: 'doctorName' },
    { label: 'Prescription No', key: 'prescriptionNo' },
    { label: 'Dispensed By', render: e => e.dispensedBy?.name || '-' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="ski-boot" title="Narcotics Register (Schedule X)" subtitle="Daily balance record for Schedule X drugs" />
      <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50/70 border border-red-200 text-sm text-red-700 animate-fade-up">
        <i className="fas fa-exclamation-triangle"></i>
        <span>Legal requirement: Maintain daily balance for all Schedule X drugs</span>
      </div>
      <GlassCard>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="glass-input w-44" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="glass-input w-44" />
        </div>
        <GlassTable columns={columns} data={entries} loading={loading} emptyMessage="No narcotics dispensing records found" />
      </GlassCard>
    </div>
  );
}
