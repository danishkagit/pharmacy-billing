import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function SalesmanList() {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', employeeCode: '', phone: '', email: '', commissionRate: 0, branches: [], territory: '' });
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      API.get('/salesmen'),
      API.get('/branches', { params: { limit: 100 } })
    ]).then(([sRes, bRes]) => {
      if (sRes.success) setSalesmen(sRes.data);
      if (bRes.success) setBranches(bRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleEdit = (s) => {
    setForm({ name: s.name, employeeCode: s.employeeCode || '', phone: s.phone || '', email: s.email || '', commissionRate: s.commissionRate || 0, branches: s.branches?.map(b => b._id) || [], territory: s.territory?.join(', ') || '' });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this salesman?')) return;
    try { await API.delete(`/salesmen/${id}`); loadData(); }
    catch (err) { alert(err?.error || 'Failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, territory: form.territory ? form.territory.split(',').map(t => t.trim()) : [] };
      if (editingId) {
        await API.put(`/salesmen/${editingId}`, payload);
      } else {
        await API.post('/salesmen', payload);
      }
      setShowForm(false); setEditingId(null); setForm({ name: '', employeeCode: '', phone: '', email: '', commissionRate: 0, branches: [], territory: '' });
      loadData();
    } catch (err) { alert(err?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salesmen</h1>
          <p className="text-sm text-gray-500 mt-1">Manage sales representatives and their commission targets</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', employeeCode: '', phone: '', email: '', commissionRate: 0, branches: [], territory: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i> {showForm ? 'Cancel' : 'Add Salesman'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Salesman' : 'New Salesman'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                <input value={form.employeeCode} onChange={e => setForm({ ...form, employeeCode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input type="number" step="0.01" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Territories (comma separated)</label>
                <input value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g. North, South, East" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Branches</label>
              <div className="flex flex-wrap gap-2">
                {branches.map(b => (
                  <label key={b._id} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={form.branches.includes(b._id)} onChange={e => { const updated = e.target.checked ? [...form.branches, b._id] : form.branches.filter(id => id !== b._id); setForm({ ...form, branches: updated }); }} className="rounded" />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : salesmen.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No salesmen yet. Click "Add Salesman" to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-center p-3 font-medium">Commission</th>
                  <th className="text-left p-3 font-medium">Territories</th>
                  <th className="text-left p-3 font-medium">Branches</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesmen.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.employeeCode || '-'}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.phone || '-'}</td>
                    <td className="p-3">{s.email || '-'}</td>
                    <td className="p-3 text-center">{s.commissionRate}%</td>
                    <td className="p-3">{s.territory?.join(', ') || '-'}</td>
                    <td className="p-3">{s.branches?.map(b => b.name).join(', ') || '-'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-xs mr-3"><i className="fas fa-edit mr-1"></i>Edit</button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:underline text-xs"><i className="fas fa-trash mr-1"></i>Deactivate</button>
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