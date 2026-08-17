import { useState, useEffect, useRef, useMemo } from 'react';
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
  const timer = useRef(null);
  const [dedupe, setDedupe] = useState(true);

  useEffect(() => {
    setLoading(true);
    clearTimeout(timer.current);
    const params = { page, limit: 50 };
    if (search.trim()) params.search = search.trim();
    if (schedule) params.schedule = schedule;
    timer.current = setTimeout(() => {
      API.get('/medicines', { params }).then(res => {
        if (res.success) {
          setMedicines(res.data);
          setTotalPages(res.pages || 1);
          setTotal(res.total || 0);
        }
      }).catch(console.error).finally(() => setLoading(false));
    }, 250);
  }, [page, search, schedule]);

  useEffect(() => { setPage(1); }, [search, schedule]);

  const scheduleBadge = { OTC: 'badge-green', H: 'badge-yellow', H1: 'badge-purple', X: 'badge-red' };

  const { visibleMedicines, hiddenCount } = useMemo(() => {
    if (!dedupe) return { visibleMedicines: medicines, hiddenCount: 0 };
    const seen = new Map();
    const vis = [];
    let hidden = 0;
    for (const m of medicines) {
      const key = `${(m.name || '').toLowerCase().trim()}::${(m.composition || '').toLowerCase().trim()}`;
      if (seen.has(key)) { hidden++; continue; }
      seen.set(key, true);
      vis.push(m);
    }
    return { visibleMedicines: vis, hiddenCount: hidden };
  }, [medicines, dedupe]);

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
              <label className="block text-xs font-medium text-slate-400 mb-1">Search catalogue</label>
              <input placeholder="Search by name, salt/composition or manufacturer (min 3 chars)..." value={search} onChange={e => setSearch(e.target.value)} className="app-input" />
              <p className="text-[11px] text-slate-400 mt-1"><i className="fas fa-pills mr-1 text-teal-500"></i>Tip: type the beginning of a drug name, a salt like "amox", "parac" or "metform", or a brand to find medicines.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dedupe}
                  onChange={e => setDedupe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-pharma-600"
                />
                <span>Hide duplicates</span>
                {hiddenCount > 0 && <span className="badge badge-teal">{hiddenCount} hidden</span>}
              </label>
              <GlassTabs tabs={[
              { key: '', label: 'All' },
              { key: 'OTC', label: 'OTC' },
              { key: 'H', label: 'Schedule H' },
              { key: 'H1', label: 'Schedule H1' },
              { key: 'X', label: 'Schedule X' },
            ]} active={schedule} onChange={setSchedule} />
          </div>
        </div>
      </div>

      <GlassTable columns={columns} data={visibleMedicines} loading={loading} emptyMessage={<>No medicines found. <Link to="/medicines/new" className="text-pharma-600 font-medium hover:underline">Add one now.</Link></>} />

      {hiddenCount > 0 && (
        <p className="text-[11px] text-slate-400 -mt-2"><i className="fas fa-link mr-1 text-teal-400"></i>{hiddenCount} record(s) with a matching name + composition are hidden. Uncheck "Hide duplicates" to see them.</p>
      )}

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
