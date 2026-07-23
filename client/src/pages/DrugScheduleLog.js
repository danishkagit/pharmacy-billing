import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function DrugScheduleLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState('');

  useEffect(() => {
    API.get('/compliance/schedule-logs', { params: { schedule: schedule || undefined, limit: 200 } }).then(res => {
      if (res.success) setLogs(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [schedule]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Drug Compliance Logs</h1>
      <p className="text-sm text-gray-500 mb-6">All Schedule H, H1, and X dispensing records</p>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <select value={schedule} onChange={e => setSchedule(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none mb-4">
          <option value="">All Schedules</option>
          <option value="H">Schedule H</option>
          <option value="H1">Schedule H1</option>
          <option value="X">Schedule X</option>
        </select>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Medicine</th>
                  <th className="text-center p-3 font-medium">Schedule</th>
                  <th className="text-right p-3 font-medium">Qty</th>
                  <th className="text-left p-3 font-medium">Patient</th>
                  <th className="text-left p-3 font-medium">Doctor</th>
                  <th className="text-left p-3 font-medium">Rx No</th>
                  <th className="text-left p-3 font-medium">Dispensed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(l.dispensedAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-medium">{l.medicineName || l.medicine?.name}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.schedule === 'X' ? 'bg-red-100 text-red-700' : l.schedule === 'H1' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{l.schedule}</span></td>
                    <td className="p-3 text-right">{l.qtyDispensed}</td>
                    <td className="p-3">{l.patientName}</td>
                    <td className="p-3">{l.doctorName}</td>
                    <td className="p-3">{l.prescriptionNo}</td>
                    <td className="p-3">{l.dispensedBy?.name || '-'}</td>
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
