import { useState, useEffect } from 'react';
import API from '../utils/api';

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
        <button onClick={async () => {
          const name = prompt('Doctor name:');
          if (name) {
            try {
              const res = await API.post('/doctors', { name, regNo: prompt('Reg No:') || '', hospital: prompt('Hospital:') || '' });
              if (res.success) setDoctors([...doctors, res.data]);
            } catch (e) { alert(e?.error || 'Failed'); }
          }
        }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><i className="fas fa-plus mr-2"></i>Add Doctor</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none mb-4" />
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(d => (
              <div key={d._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm">
                <h3 className="font-medium">{d.name}</h3>
                <p className="text-sm text-gray-500">{d.specialization || 'General'} {d.regNo ? `| Reg: ${d.regNo}` : ''}</p>
                <p className="text-sm text-gray-400">{d.hospital || ''}</p>
                {d.phone && <p className="text-sm text-gray-400">{d.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
