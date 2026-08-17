import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

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

  const inputCls = "glass-input";
  const labelCls = "block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5";

  const columns = [
    { label: 'Code', render: s => s.employeeCode || '-', tdClass: 'font-medium' },
    { key: 'name', label: 'Name' },
    { label: 'Phone', render: s => s.phone || '-' },
    { label: 'Email', render: s => s.email || '-' },
    { label: 'Commission', className: 'text-center', tdClass: 'text-center font-medium', render: s => `${s.commissionRate}%` },
    { label: 'Territories', render: s => s.territory?.join(', ') || '-', tdClass: 'text-slate-500' },
    { label: 'Branches', render: s => s.branches?.map(b => b.name).join(', ') || '-', tdClass: 'text-slate-500' },
    { label: 'Actions', className: 'text-center', tdClass: 'text-center', render: s => (
      <>
        <button onClick={() => handleEdit(s)} className="btn btn-ghost btn-sm text-pharma-600 mr-1"><i className="fas fa-edit mr-1"></i>Edit</button>
        <button onClick={() => handleDelete(s._id)} className="btn btn-ghost btn-sm text-red-400 hover:text-red-500"><i className="fas fa-trash mr-1"></i>Deactivate</button>
      </>
    ) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="id-badge" title="Salesmen" subtitle="Manage sales representatives and commission targets">
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', employeeCode: '', phone: '', email: '', commissionRate: 0, branches: [], territory: '' }); }} className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-primary'}`}>
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i> {showForm ? 'Cancel' : 'Add Salesman'}
        </button>
      </PageHeader>

      {showForm && (
        <GlassCard className="animate-fade-up">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{editingId ? 'Edit Salesman' : 'New Salesman'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Employee Code</label>
                <input value={form.employeeCode} onChange={e => setForm({ ...form, employeeCode: e.target.value })} className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Commission Rate (%)</label>
                <input type="number" step="0.01" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Territories (comma separated)</label>
                <input value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} className={inputCls} placeholder="e.g. North, South, East" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Assigned Branches</label>
              <div className="flex flex-wrap gap-2">
                {branches.map(b => (
                  <label key={b._id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200 text-sm cursor-pointer hover:border-pharma-300 transition-colors">
                    <input type="checkbox" checked={form.branches.includes(b._id)} onChange={e => { const updated = e.target.checked ? [...form.branches, b._id] : form.branches.filter(id => id !== b._id); setForm({ ...form, branches: updated }); }} className="rounded accent-pharma-500" />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary btn-glow">{saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard>
        <GlassTable columns={columns} data={salesmen} loading={loading} emptyMessage={<>No salesmen yet. <button onClick={() => setShowForm(true)} className="text-pharma-600 font-medium hover:underline">Add one now.</button></>} />
      </GlassCard>
    </div>
  );
}