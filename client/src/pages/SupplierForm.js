import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ name: '', company: '', gstin: '', pan: '', dlNo: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', zone: '', creditDays: 0, creditLimit: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      API.get(`/suppliers/${id}`).then(res => {
        if (res.success) {
          const s = res.data;
          setForm({ name: s.name, company: s.company || '', gstin: s.gstin || '', pan: s.pan || '', dlNo: s.dlNo || '', address: s.address || '', city: s.city || '', state: s.state || '', pincode: s.pincode || '', phone: s.phone || '', email: s.email || '', zone: s.zone || '', creditDays: s.creditDays, creditLimit: s.creditLimit });
        }
      }).catch(err => setError(err?.error || 'Failed to load'));
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (/^\d{6}$/.test(form.pincode || '') && !form.city && !form.state) {
      let active = true;
      API.get(`/lookup/pincode/${form.pincode}`).then(r => {
        if (r.success && r.data && active) {
          setForm(f => ({ ...f, city: f.city || r.data.city || '', state: f.state || r.data.state || '' }));
        }
      }).catch(() => {});
      return () => { active = false; };
    }
  }, [form.pincode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = isEdit ? await API.put(`/suppliers/${id}`, form) : await API.post('/suppliers', form);
      if (res.success) navigate('/suppliers');
    } catch (err) { setError(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title={isEdit ? 'Edit Supplier' : 'Add Supplier'} subtitle="Manage supplier and vendor masters" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Supplier Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Drug License No</label><input value={form.dlNo} onChange={e => setForm({ ...form, dlNo: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Credit Days</label><input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: parseInt(e.target.value) || 0 })} min={0} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Credit Limit</label><input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} min={0} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Zone</label><input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="glass-input" /></div>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : isEdit ? 'Update Supplier' : 'Add Supplier'}</button>
            <button type="button" onClick={() => navigate('/suppliers')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
