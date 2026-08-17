import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/patients', { params: { search, limit: 200 } }).then(res => {
      if (res.success) setPatients(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  const columns = [
    { key: 'name', label: 'Name', tdClass: 'font-medium' },
    { label: 'Phone', render: p => p.phone || '-' },
    { label: 'Doctor', render: p => p.doctor?.name || '-' },
    { label: 'ABHA ID', render: p => p.abhaId || '-', tdClass: 'text-slate-500' },
    { label: 'Conditions', render: p => p.chronicConditions?.join(', ') || '-' },
    { label: 'Allergies', render: p => p.allergies?.join(', ') || '-' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="hospital-user" title="Patients" subtitle="Registered patients and health profiles" />
      <GlassCard>
        <input placeholder="Search by name, phone or ABHA ID..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input mb-4 max-w-md" />
        <GlassTable columns={columns} data={patients} loading={loading} emptyMessage="No patients found" />
      </GlassCard>
    </div>
  );
}
