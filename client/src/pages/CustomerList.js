import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    API.get('/customers', { params: { search, type: type || undefined, limit: 200 } }).then(res => {
      if (res.success) setCustomers(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <Link to="/customers/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> Add Customer
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <select value={type} onChange={e => setType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Types</option>
            <option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="both">Both</option>
          </select>
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-center p-3 font-medium">Type</th>
                  <th className="text-right p-3 font-medium">Credit Limit</th>
                  <th className="text-right p-3 font-medium">Loyalty Points</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-gray-500">{c.phone || '-'}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${c.type === 'wholesale' ? 'bg-purple-100 text-purple-700' : c.type === 'both' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{c.type}</span></td>
                    <td className="p-3 text-right">₹{c.creditLimit?.toFixed(0)}</td>
                    <td className="p-3 text-right">{c.loyaltyPoints || 0}</td>
                    <td className="p-3 text-center">
                      <Link to={`/customers/${c._id}/edit`} className="text-blue-600 hover:underline text-xs mr-2">Edit</Link>
                      <button onClick={() => API.delete(`/customers/${c._id}`).then(() => setCustomers(prev => prev.filter(x => x._id !== c._id)))} className="text-red-500 hover:underline text-xs">Deactivate</button>
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
