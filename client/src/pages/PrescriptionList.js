import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/prescriptions', { params: { search, limit: 100 } }).then(res => {
      if (res.success) setPrescriptions(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
        <Link to="/prescriptions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><i className="fas fa-plus mr-2"></i>Add Prescription</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <input placeholder="Search prescription no, patient name, doctor..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none mb-4" />
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Rx No</th>
                  <th className="text-left p-3 font-medium">Patient</th>
                  <th className="text-left p-3 font-medium">Doctor</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Items</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions.map(rx => (
                  <tr key={rx._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{rx.prescriptionNo}</td>
                    <td className="p-3">{rx.patientName}</td>
                    <td className="p-3">{rx.doctorName || rx.doctor?.name || '-'}</td>
                    <td className="p-3 text-gray-500">{new Date(rx.date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right">{rx.medicines?.length || 0}</td>
                    <td className="p-3 text-center">
                      <Link to={`/sales/new?rx=${rx._id}`} className="text-blue-600 hover:underline text-xs">Bill</Link>
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
