import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function StaffManagement() {
  const { hasPermission } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/staff').then(res => { if (res.success) setStaff(res.data); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const addStaff = async () => {
    const name = prompt('Name:');
    if (!name) return;
    const email = prompt('Email:');
    if (!email) return;
    const password = prompt('Password (min 6 chars):');
    const role = prompt('Role (cashier/pharmacist/salesman/admin):') || 'cashier';
    try {
      const res = await API.post('/staff', { name, email, password, role, permissions: { billing: true, purchase: role === 'admin', inventory: role === 'admin', returns: role !== 'cashier', accounting: role === 'admin', reports: role !== 'cashier', staff: role === 'admin', settings: role === 'admin', compliance: role !== 'cashier' } });
      if (res.success) setStaff([...staff, res.data]);
    } catch (err) { alert(err?.error || 'Failed'); }
  };

  if (!hasPermission('staff')) return <div className="text-center py-12 text-gray-500"><i className="fas fa-lock text-4xl mb-4"></i><p>You don't have permission to manage staff.</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
        <button onClick={addStaff} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><i className="fas fa-user-plus mr-2"></i>Add Staff</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Branch</th>
                  <th className="text-center p-3 font-medium">Active</th>
                  <th className="text-left p-3 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-medium capitalize bg-blue-100 text-blue-700">{s.role}</span></td>
                    <td className="p-3 text-gray-500">{s.branch?.name || '-'}</td>
                    <td className="p-3 text-center">{s.isActive ? <span className="text-green-600"><i className="fas fa-check-circle"></i></span> : <span className="text-red-500"><i className="fas fa-times-circle"></i></span>}</td>
                    <td className="p-3 text-gray-500">{s.lastLogin ? new Date(s.lastLogin).toLocaleString('en-IN') : 'Never'}</td>
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
