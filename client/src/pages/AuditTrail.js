import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function AuditTrail() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/audit', { params: { limit: 100 } }).then(res => {
      if (res.success) setLogs(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!hasPermission('settings')) return <div className="text-center py-12 text-gray-500"><i className="fas fa-lock text-4xl mb-4"></i><p>Access restricted to admins</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Trail</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Timestamp</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Model</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                    <td className="p-3 font-medium">{l.userName || l.userId?.name || 'System'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.action === 'create' ? 'bg-green-100 text-green-700' : l.action === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.action}</span></td>
                    <td className="p-3">{l.model}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{l.description || '-'}</td>
                    <td className="p-3 text-gray-500">{l.ip || '-'}</td>
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
