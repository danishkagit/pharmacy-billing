import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function CompanySetup() {
  const { company } = useAuth();
  const [form, setForm] = useState({ name: '', legalName: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', gstin: '', pan: '', dlNo: '', fssaiNo: '', dlExpiryDate: '', fssaiExpiryDate: '', drugLicenseCategory: 'both', invoiceNote: '', upiId: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({ name: company.name || '', legalName: company.legalName || '', address: company.address || '', city: company.city || '', state: company.state || '', pincode: company.pincode || '', phone: company.phone || '', email: company.email || '', gstin: company.gstin || '', pan: company.pan || '', dlNo: company.dlNo || '', fssaiNo: company.fssaiNo || '', dlExpiryDate: company.dlExpiryDate ? company.dlExpiryDate.split('T')[0] : '', fssaiExpiryDate: company.fssaiExpiryDate ? company.fssaiExpiryDate.split('T')[0] : '', drugLicenseCategory: company.drugLicenseCategory || 'both', invoiceNote: company.invoiceNote || 'Thank you for your business!', upiId: company.upiId || '' });
    }
  }, [company]);

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
    try {
      const res = await API.put('/company', form);
      if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (err) { alert(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Company Settings" subtitle="Business identity and license details" />
      <GlassCard>
        {saved && <div className="animate-fade-up bg-green-50/80 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-green-200"><i className="fas fa-check-circle"></i>Settings saved successfully</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pharmacy Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="glass-input" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Legal Name</label><input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">PAN</label><input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Drug License No</label><input value={form.dlNo} onChange={e => setForm({ ...form, dlNo: e.target.value })} className="glass-input uppercase" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">DL Expiry</label><input type="date" value={form.dlExpiryDate} onChange={e => setForm({ ...form, dlExpiryDate: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">FSSAI No</label><input value={form.fssaiNo} onChange={e => setForm({ ...form, fssaiNo: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">FSSAI Expiry</label><input type="date" value={form.fssaiExpiryDate} onChange={e => setForm({ ...form, fssaiExpiryDate: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">License Category</label>
              <select value={form.drugLicenseCategory} onChange={e => setForm({ ...form, drugLicenseCategory: e.target.value })} className="glass-select">
                <option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="both">Both</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">UPI ID</label><input value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} className="glass-input" placeholder="yourname@okbank" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Invoice Footer Note</label><textarea value={form.invoiceNote} onChange={e => setForm({ ...form, invoiceNote: e.target.value })} rows={2} className="glass-input" /></div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-save mr-1"></i>{loading ? 'Saving...' : 'Save Settings'}</button>
        </form>
      </GlassCard>
    </div>
  );
}
