import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/prescriptions', { params: { search, limit: 100 } }).then(res => {
      if (res.success) setPrescriptions(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  const columns = [
    { key: 'prescriptionNo', label: 'Rx No', tdClass: 'font-medium' },
    { key: 'patientName', label: 'Patient' },
    { label: 'Doctor', render: rx => rx.doctorName || rx.doctor?.name || '-', tdClass: 'text-slate-500' },
    { label: 'Date', render: rx => new Date(rx.date).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Items', className: 'text-right', tdClass: 'text-right', render: rx => rx.medicines?.length || 0 },
    { label: 'Actions', className: 'text-center', tdClass: 'text-center', render: rx => <Link to={`/sales/new?rx=${rx._id}`} className="btn btn-ghost btn-sm text-pharma-600"><i className="fas fa-cash-register mr-1"></i>Bill</Link> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Prescriptions" subtitle="Manage patient prescriptions">
        <Link to="/prescriptions/new" className="btn btn-primary"><i className="fas fa-plus"></i> Add Prescription</Link>
      </PageHeader>
      <GlassCard>
        <input placeholder="Search prescription no, patient name, doctor..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input mb-4 max-w-md" />
        <GlassTable columns={columns} data={prescriptions} loading={loading} emptyMessage="No prescriptions found" />
      </GlassCard>
    </div>
  );
}
