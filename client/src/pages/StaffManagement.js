import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, GlassTable } from '../components/ui';

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

  if (!hasPermission('staff')) return <div className="text-center py-12 text-slate-500"><i className="fas fa-lock text-4xl mb-4 text-slate-300"></i><p>You don't have permission to manage staff.</p></div>;

  const columns = [
    { label: 'Name', render: s => <span className="font-medium">{s.name}</span> },
    { label: 'Email', render: s => s.email },
    { label: 'Role', render: s => <span className="badge badge-blue capitalize">{s.role}</span> },
    { label: 'Branch', className: 'text-slate-500', render: s => s.branch?.name || '-' },
    { label: 'Active', className: 'text-center', tdClass: 'text-center', render: s => s.isActive ? <span className="text-emerald-500"><i className="fas fa-check-circle"></i></span> : <span className="text-red-500"><i className="fas fa-times-circle"></i></span> },
    { label: 'Last Login', className: 'text-slate-500', render: s => s.lastLogin ? new Date(s.lastLogin).toLocaleString('en-IN') : 'Never' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader icon="user-cog" title="Staff Management" subtitle="Manage users and their access roles" />
        <button onClick={addStaff} className="btn btn-primary btn-glow"><i className="fas fa-user-plus mr-1"></i>Add Staff</button>
      </div>
      <GlassTable columns={columns} data={staff} loading={loading} emptyMessage="No staff members yet" />
    </div>
  );
}
