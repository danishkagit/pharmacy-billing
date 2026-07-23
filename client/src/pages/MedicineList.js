import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

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

  const scheduleColors = { OTC: 'bg-gray-100 text-gray-700', H: 'bg-yellow-100 text-yellow-700', H1: 'bg-orange-100 text-orange-700', X: 'bg-red-100 text-red-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medicines</h1>
        <Link to="/medicines/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> Add Medicine
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input placeholder="Search by name, composition, manufacturer..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <select value={schedule} onChange={e => setSchedule(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Schedules</option>
            <option value="OTC">OTC</option>
            <option value="H">Schedule H</option>
            <option value="H1">Schedule H1</option>
            <option value="X">Schedule X</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : medicines.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No medicines found. <Link to="/medicines/new" className="text-blue-600">Add one now.</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Composition</th>
                  <th className="text-left p-3 font-medium">Manufacturer</th>
                  <th className="text-center p-3 font-medium">Schedule</th>
                  <th className="text-center p-3 font-medium">GST</th>
                  <th className="text-right p-3 font-medium">MRP</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medicines.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-gray-500">{m.composition || '-'}</td>
                    <td className="p-3 text-gray-500">{m.manufacturer || '-'}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scheduleColors[m.schedule] || 'bg-gray-100'}`}>{m.schedule}</span></td>
                    <td className="p-3 text-center">{m.gstRate}%</td>
                    <td className="p-3 text-right font-medium">₹{m.mrp?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Link to={`/medicines/${m._id}/edit`} className="text-blue-600 hover:underline text-xs mr-2">Edit</Link>
                      <button onClick={() => { if (window.confirm('Deactivate this medicine?')) API.delete(`/medicines/${m._id}`).then(() => setMedicines(prev => prev.filter(x => x._id !== m._id))); }} className="text-red-500 hover:underline text-xs">Deactivate</button>
                    </td>
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
