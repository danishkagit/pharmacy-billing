import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassTable, GlassTabs } from '../components/ui';

export default function MedicineList() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schedule, setSchedule] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 50 };
    if (search) params.search = search;
    if (schedule) params.schedule = schedule;
    API.get('/medicines', { params }).then(res => {
      if (res.success) {
        setMedicines(res.data);
        setTotalPages(res.pages || 1);
        setTotal(res.total || 0);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, search, schedule]);

  useEffect(() => { setPage(1); }, [search, schedule]);

  const scheduleBadge = { OTC: 'badge-green', H: 'badge-yellow', H1: 'badge-purple', X: 'badge-red' };

  const columns = [
    { label: 'Name', key: 'name', className: 'text-left', tdClass: 'font-medium text-slate-800' },
    { label: 'Composition', className: 'text-left', tdClass: 'text-slate-500 max-w-[200px] truncate', render: row => row.composition || <span className="text-slate-300 italic">Missing</span> },
    { label: 'Mfr', className: 'text-left', tdClass: 'text-slate-500', render: row => row.manufacturer || '-' },
    { label: 'Category', className: 'text-center', tdClass: 'text-center capitalize', render: row => row.category || '-' },
    { label: 'Schedule', className: 'text-center', tdClass: 'text-center', render: row => <span className={`badge ${scheduleBadge[row.schedule] || 'badge-gray'}`}>{row.schedule}</span> },
    { label: 'MRP', className: 'text-right', tdClass: 'text-right font-semibold text-slate-700', render: row => `₹${row.mrp?.toFixed(2)}` },
    { label: 'Actions', className: 'text-center', tdClass: 'text-center', render: row => (
      <div className="flex items-center justify-center gap-1">
        <Link to={`/medicines/${row._id}/edit`} className="btn btn-ghost btn-sm text-pharma-600">Edit</Link>
        <button onClick={() => { if (window.confirm('Deactivate this medicine?')) API.delete(`/medicines/${row._id}`).then(() => setMedicines(prev => prev.filter(x => x._id !== row._id))); }} className="btn btn-ghost btn-sm text-red-400 hover:text-red-500">Deactivate</button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Medicines" subtitle={`${total} medicines in catalog`}>
        <Link to="/medicines/new" className="btn btn-primary"><i className="fas fa-plus"></i> Add New</Link>
        <Link to="/medicines/import" className="btn btn-secondary"><i className="fas fa-upload"></i> Import</Link>
      </PageHeader>

      <div className="app-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input placeholder="Search by name, composition, manufacturer..." value={search} onChange={e => setSearch(e.target.value)} className="app-input" />
          </div>
          <GlassTabs tabs={[
            { key: '', label: 'All' },
            { key: 'OTC', label: 'OTC' },
            { key: 'H', label: 'Schedule H' },
            { key: 'H1', label: 'Schedule H1' },
            { key: 'X', label: 'Schedule X' },
          ]} active={schedule} onChange={setSchedule} />
        </div>
      </div>

      <GlassTable columns={columns} data={medicines} loading={loading} emptyMessage={<>No medicines found. <Link to="/medicines/new" className="text-pharma-600 font-medium hover:underline">Add one now.</Link></>} />

      {totalPages > 1 && (
        <div className="app-card px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-ghost btn-sm">
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-pharma-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {p}
              </button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-ghost btn-sm">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
