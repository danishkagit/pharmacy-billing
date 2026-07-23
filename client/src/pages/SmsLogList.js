import { useState, useEffect } from 'react';
import API from '../utils/api';

const STATUS_COLORS = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700'
};

const TYPE_OPTIONS = ['', 'receipt', 'invoice', 'reminder', 'otp', 'promotional', 'loyalty', 'delivery', 'prescription', 'other'];

export default function SmsLogList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ type: '', from: '', to: '' });

  useEffect(() => {
    setLoading(true);
    API.get('/sms/logs', { params: { ...filter, page, limit: 20 } }).then(res => {
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pages || 1);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">SMS / WhatsApp Logs</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4 flex-wrap">
          <select value={filter.type} onChange={e => { setFilter({ ...filter, type: e.target.value }); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Types</option>
            {TYPE_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input type="date" value={filter.from} onChange={e => { setFilter({ ...filter, from: e.target.value }); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <input type="date" value={filter.to} onChange={e => { setFilter({ ...filter, to: e.target.value }); setPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><i className="fas fa-comment-slash text-4xl mb-3"></i><p>No logs found</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3 font-medium">Recipient</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-center p-3 font-medium">Channel</th>
                    <th className="text-left p-3 font-medium">Message</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{log.recipient}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">{log.type}</span></td>
                      <td className="p-3 text-center">
                        {log.channel === 'whatsapp' ? <i className="fab fa-whatsapp text-green-500 text-lg" title="WhatsApp"></i> : <i className="fas fa-sms text-blue-500 text-lg" title="SMS"></i>}
                      </td>
                      <td className="p-3 text-gray-500 max-w-xs truncate">{log.message}</td>
                      <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-700'}`}>{log.status}</span></td>
                      <td className="p-3 text-gray-500">{new Date(log.createdAt || log.date).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
