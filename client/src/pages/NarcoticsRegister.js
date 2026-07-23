import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function NarcoticsRegister() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    API.get('/narcotics', { params: { from, to, limit: 200 } }).then(res => {
      if (res.success) setEntries(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [from, to]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Narcotics Register (Schedule X)</h1>
      <p className="text-sm text-red-600 mb-6"><i className="fas fa-exclamation-triangle mr-2"></i>Legal requirement: Maintain daily balance for all Schedule X drugs</p>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : entries.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No narcotics dispensing records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Medicine</th>
                  <th className="text-left p-3 font-medium">Batch</th>
                  <th className="text-right p-3 font-medium">Sold Qty</th>
                  <th className="text-left p-3 font-medium">Patient</th>
                  <th className="text-left p-3 font-medium">Doctor</th>
                  <th className="text-left p-3 font-medium">Prescription No</th>
                  <th className="text-left p-3 font-medium">Dispensed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-medium">{e.medicineName || e.medicine?.name}</td>
                    <td className="p-3">{e.batchNo || '-'}</td>
                    <td className="p-3 text-right font-medium">{e.soldQty}</td>
                    <td className="p-3">{e.patientName}</td>
                    <td className="p-3">{e.doctorName}</td>
                    <td className="p-3">{e.prescriptionNo}</td>
                    <td className="p-3">{e.dispensedBy?.name || '-'}</td>
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
