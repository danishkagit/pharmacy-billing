import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/doctors', { params: { search, limit: 200 } }).then(res => {
      if (res.success) setDoctors(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-5">
      <PageHeader icon="user-md" title="Doctors" subtitle="Prescribers registered in the system">
        <button onClick={async () => {
          const name = prompt('Doctor name:');
          if (name) {
            try {
              const res = await API.post('/doctors', { name, regNo: prompt('Reg No:') || '', hospital: prompt('Hospital:') || '' });
              if (res.success) setDoctors([...doctors, res.data]);
            } catch (e) { alert(e?.error || 'Failed'); }
          }
        }} className="btn btn-primary btn-sm"><i className="fas fa-plus mr-1"></i>Add Doctor</button>
      </PageHeader>
      <GlassCard>
        <input placeholder="Search by name, reg no or hospital..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input mb-4 max-w-md" />
        {loading ? (
          <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500"></div></div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <div className="w-14 h-14 rounded-2xl grad-accent-soft flex items-center justify-center mx-auto mb-3"><i className="fas fa-user-md text-pharma-400"></i></div>
            <p className="font-medium">No doctors found. Add one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {doctors.map(d => (
              <div key={d._id} className="app-card app-card-hover p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl grad-accent-soft flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user-md text-pharma-600"></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{d.name}</h3>
                    <p className="text-xs text-slate-500">{d.specialization || 'General'} {d.regNo ? `| Reg: ${d.regNo}` : ''}</p>
                  </div>
                </div>
                {d.hospital && <p className="text-xs text-slate-400 mt-2"><i className="fas fa-hospital-alt mr-1"></i>{d.hospital}</p>}
                {d.phone && <p className="text-xs text-slate-400"><i className="fas fa-phone-alt mr-1"></i>{d.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
