import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/patients', { params: { search, limit: 200 } }).then(res => {
      if (res.success) setPatients(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <input placeholder="Search by name, phone or ABHA ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none mb-4" />
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Doctor</th>
                  <th className="text-left p-3 font-medium">ABHA ID</th>
                  <th className="text-left p-3 font-medium">Conditions</th>
                  <th className="text-left p-3 font-medium">Allergies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.phone || '-'}</td>
                    <td className="p-3">{p.doctor?.name || '-'}</td>
                    <td className="p-3 text-gray-500">{p.abhaId || '-'}</td>
                    <td className="p-3">{p.chronicConditions?.join(', ') || '-'}</td>
                    <td className="p-3">{p.allergies?.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
