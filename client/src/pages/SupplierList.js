import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/suppliers', { params: { search, limit: 200 } }).then(res => {
      if (res.success) setSuppliers(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <Link to="/suppliers/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> Add Supplier
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input placeholder="Search by name, company or phone..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">GSTIN</th>
                  <th className="text-left p-3 font-medium">DL No</th>
                  <th className="text-right p-3 font-medium">Credit Days</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-gray-500">{s.company || '-'}</td>
                    <td className="p-3 text-gray-500">{s.phone || '-'}</td>
                    <td className="p-3 text-gray-500">{s.gstin || '-'}</td>
                    <td className="p-3 text-gray-500">{s.dlNo || '-'}</td>
                    <td className="p-3 text-right">{s.creditDays}</td>
                    <td className="p-3 text-center">
                      <Link to={`/suppliers/${s._id}/edit`} className="text-blue-600 hover:underline text-xs mr-2">Edit</Link>
                      <button onClick={() => { if (window.confirm('Deactivate?')) API.delete(`/suppliers/${s._id}`).then(() => setSuppliers(prev => prev.filter(x => x._id !== s._id))); }} className="text-red-500 hover:underline text-xs">Deactivate</button>
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
