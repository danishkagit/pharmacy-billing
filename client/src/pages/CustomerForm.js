import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ name: '', type: 'retail', phone: '', email: '', gstin: '', pan: '', address: '', city: '', state: '', pincode: '', creditLimit: 0, creditDays: 0, dob: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      API.get(`/customers/${id}`).then(res => {
        if (res.success) {
          const c = res.data;
          setForm({ name: c.name, type: c.type, phone: c.phone || '', email: c.email || '', gstin: c.gstin || '', pan: c.pan || '', address: c.address || '', city: c.city || '', state: c.state || '', pincode: c.pincode || '', creditLimit: c.creditLimit, creditDays: c.creditDays, dob: c.dob ? c.dob.split('T')[0] : '', notes: c.notes || '' });
        }
      }).catch(err => setError(err?.error || 'Failed to load'));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = isEdit ? await API.put(`/customers/${id}`, form) : await API.post('/customers', form);
      if (res.success) navigate('/customers');
    } catch (err) { setError(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title={isEdit ? 'Edit Customer' : 'Add Customer'} subtitle="Maintain customer master records" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="glass-select"><option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="both">Both</option></select></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">PAN</label><input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Credit Limit (₹)</label><input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} min={0} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Credit Days</label><input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: parseInt(e.target.value) || 0 })} min={0} className="glass-input" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="glass-input" /></div>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}</button>
            <button type="button" onClick={() => navigate('/customers')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
