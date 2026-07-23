import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable, GlassTabs } from '../components/ui';

export default function MedicineList() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schedule, setSchedule] = useState('');

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (schedule) params.schedule = schedule;
    API.get('/medicines', { params }).then(res => {
      if (res.success) setMedicines(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, schedule]);

  const scheduleBadge = { OTC: 'badge-green', H: 'badge-yellow', H1: 'badge-purple', X: 'badge-red' };

  const columns = [
    { label: 'Name', key: 'name', className: 'text-left', tdClass: 'font-medium' },
    { label: 'Composition', className: 'text-left', tdClass: 'text-gray-400', render: row => row.composition || '-' },
    { label: 'Manufacturer', className: 'text-left', tdClass: 'text-gray-400', render: row => row.manufacturer || '-' },
    { label: 'Category', className: 'text-center', tdClass: 'text-center capitalize', render: row => row.category || '-' },
    { label: 'Schedule', className: 'text-center', tdClass: 'text-center', render: row => <span className={`badge ${scheduleBadge[row.schedule] || 'badge-gray'}`}>{row.schedule}</span> },
    { label: 'MRP', className: 'text-right', tdClass: 'text-right font-medium', render: row => `₹${row.mrp?.toFixed(2)}` },
    { label: 'Actions', className: 'text-center', tdClass: 'text-center', render: row => (
      <>
        <Link to={`/medicines/${row._id}/edit`} className="btn-ghost text-xs mr-2">Edit</Link>
        <button onClick={() => { if (window.confirm('Deactivate this medicine?')) API.delete(`/medicines/${row._id}`).then(() => setMedicines(prev => prev.filter(x => x._id !== row._id))); }} className="btn-ghost text-red-400 hover:text-red-300 text-xs">Deactivate</button>
      </>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Medicines" subtitle="Manage your medicine catalog">
        <Link to="/medicines/new" className="btn-primary"><i className="fas fa-plus"></i> Add New</Link>
        <Link to="/medicines/import" className="btn-ghost"><i className="fas fa-upload"></i> Import</Link>
      </PageHeader>

      <GlassCard>
        <input placeholder="Search by name, composition, manufacturer..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input w-full mb-4" />
        <GlassTabs tabs={[
          { key: '', label: 'All' },
          { key: 'OTC', label: 'OTC' },
          { key: 'H', label: 'H' },
          { key: 'H1', label: 'H1' },
          { key: 'X', label: 'X' },
        ]} active={schedule} onChange={setSchedule} />
      </GlassCard>

      <GlassTable columns={columns} data={medicines} loading={loading} emptyMessage={<>No medicines found. <Link to="/medicines/new" className="text-primary-400">Add one now.</Link></>} />
    </div>
  );
}
