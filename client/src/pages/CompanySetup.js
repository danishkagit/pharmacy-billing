import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

function expiryStatus(dateStr) {
  if (!dateStr) return { label: 'Not set', cls: 'badge badge-gray' };
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d - new Date(now.setHours(0,0,0,0))) / 86400000);
  if (diffDays < 0) return { label: 'Expired', cls: 'badge badge-red' };
  if (diffDays <= 30) return { label: `${diffDays}d left`, cls: 'badge badge-orange' };
  if (diffDays <= 90) return { label: `${diffDays}d left`, cls: 'badge badge-yellow' };
  return { label: 'Valid', cls: 'badge badge-success' };
}

export default function CompanySetup() {
  const { company } = useAuth();
  const sigInputRef = useRef(null);
  const [form, setForm] = useState({ name: '', legalName: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', gstin: '', pan: '', dlNo: '', dlNoWholesale: '', fssaiNo: '', dlExpiryDate: '', fssaiExpiryDate: '', drugLicenseCategory: 'retail', invoiceNote: '', upiId: '', bankName: '', bankAccountNo: '', bankIfsc: '', pharmacistName: '', pharmacistRegNo: '', pharmacistSignature: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({ name: company.name || '', legalName: company.legalName || '', address: company.address || '', city: company.city || '', state: company.state || '', pincode: company.pincode || '', phone: company.phone || '', email: company.email || '', gstin: company.gstin || '', pan: company.pan || '', dlNo: company.dlNo || '', dlNoWholesale: company.dlNoWholesale || '', fssaiNo: company.fssaiNo || '', dlExpiryDate: company.dlExpiryDate ? company.dlExpiryDate.split('T')[0] : '', fssaiExpiryDate: company.fssaiExpiryDate ? company.fssaiExpiryDate.split('T')[0] : '', drugLicenseCategory: 'retail', invoiceNote: company.invoiceNote || 'Thank you for your business!', upiId: company.upiId || '', bankName: company.bankName || '', bankAccountNo: company.bankAccountNo || '', bankIfsc: company.bankIfsc || '', pharmacistName: company.pharmacistName || '', pharmacistRegNo: company.pharmacistRegNo || '', pharmacistSignature: company.pharmacistSignature || '' });
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

  const handleSignaturePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file (PNG/JPG) for the signature.'); return; }
    if (file.size > 1024 * 1024) { alert('Signature image should be under 1MB. Please use a cropped, clear scan.'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, pharmacistSignature: String(reader.result) }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/company', form);
      if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (err) { alert(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const dlStatus = expiryStatus(form.dlExpiryDate);
  const fssaiStatus = expiryStatus(form.fssaiExpiryDate);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader icon="store" title="Pharmacy Profile" subtitle="Update your pharmacy identity, licenses, pharmacist signature & bank details — printed on every bill" />

      {/* Profile header */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow">
          <i className="fas fa-store text-xl"></i>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-slate-900 dark:text-white truncate">{form.name || 'Your Pharmacy'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{form.city ? `${form.city}, ${form.state} ${form.pincode}` : 'Complete your profile to show on invoices'}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={dlStatus.cls}>DL {dlStatus.label}</span>
            <span className={fssaiStatus.cls}>FSSAI {fssaiStatus.label}</span>
            {form.pharmacistName && <span className="badge badge-blue">Pharmacist: {form.pharmacistName}</span>}
            {form.pan && <span className="badge badge-gray font-mono">PAN {form.pan}</span>}
          </div>
        </div>
      </div>

      <GlassCard>
        {saved && <div className="animate-fade-up bg-green-50/80 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-green-200"><i className="fas fa-check-circle"></i>Pharmacy profile saved successfully — will appear on next bill</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Identity */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs"><i className="fas fa-building"></i></span> Business Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pharmacy Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="glass-input" placeholder="e.g. Ghosh Medical Hall" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Legal Name</label><input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} className="glass-input" placeholder="As per trade license" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input" placeholder="+91..." /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input" placeholder="pharmacy@email.com" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="glass-input" placeholder="Street, locality, landmark" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="glass-input" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="glass-input" placeholder="700001" /></div>
            </div>
          </div>

          {/* Licenses & Regulatory — grouped for easy updation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1"><span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs"><i className="fas fa-certificate"></i></span> Licenses &amp; Regulatory</h3>
            <p className="text-xs text-slate-500 mb-3">Update anytime — these print on invoices and are checked at inspections. Expiry status is shown in the header above.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="glass-input uppercase font-mono" placeholder="19AABCU1234H1Z5" maxLength={15} /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">PAN Number</label><input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} className="glass-input uppercase font-mono" placeholder="AABCU1234H" maxLength={10} /><p className="text-[10px] text-slate-400 mt-1">10-char PAN as per income-tax records</p></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Drug License No. (Form 20/21) *</label><input value={form.dlNo} onChange={e => setForm({ ...form, dlNo: e.target.value })} className="glass-input uppercase font-mono" placeholder="WB/XXX/DL/..." /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">DL Expiry Date</label><div className="flex gap-2"><input type="date" value={form.dlExpiryDate} onChange={e => setForm({ ...form, dlExpiryDate: e.target.value })} className="glass-input flex-1" /><span className={dlStatus.cls + ' self-center'}>{dlStatus.label}</span></div></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">FSSAI License No.</label><input value={form.fssaiNo} onChange={e => setForm({ ...form, fssaiNo: e.target.value })} className="glass-input font-mono" placeholder="14-digit FSSAI" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">FSSAI Expiry Date</label><div className="flex gap-2"><input type="date" value={form.fssaiExpiryDate} onChange={e => setForm({ ...form, fssaiExpiryDate: e.target.value })} className="glass-input flex-1" /><span className={fssaiStatus.cls + ' self-center'}>{fssaiStatus.label}</span></div></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">License Category</label><div className="glass-input flex items-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">Retail — Chemist Counter</div></div>
            </div>
          </div>

          {/* Registered Pharmacist — signature printed on bills */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1"><span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs"><i className="fas fa-user-doctor"></i></span> Registered Pharmacist <span className="text-xs font-normal text-slate-400">— signature prints on every sale bill</span></h3>
            <p className="text-xs text-slate-500 mb-3">As per Drugs &amp; Cosmetics Rules, retail bills must bear the registered pharmacist&apos;s name, registration number and signature.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pharmacist Full Name</label><input value={form.pharmacistName} onChange={e => setForm({ ...form, pharmacistName: e.target.value })} className="glass-input" placeholder="e.g. Dr. Amitava Ghosh" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Registration No.</label><input value={form.pharmacistRegNo} onChange={e => setForm({ ...form, pharmacistRegNo: e.target.value })} className="glass-input uppercase font-mono" placeholder="WB/PH/12345" /></div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Signature Image (PNG/JPG, &lt;1MB, transparent background recommended)</label>
                <input ref={sigInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSignaturePick} className="hidden" />
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => sigInputRef.current?.click()} className="btn btn-secondary btn-sm"><i className="fas fa-upload"></i> {form.pharmacistSignature ? 'Change Signature' : 'Upload Signature'}</button>
                  {form.pharmacistSignature && <button type="button" onClick={() => setForm(f => ({ ...f, pharmacistSignature: '' }))} className="btn btn-ghost btn-sm text-red-600"><i className="fas fa-trash"></i> Remove</button>}
                  <span className="text-[11px] text-slate-400">Shows at the bottom-right of every printed bill. Use a clear scan on white.</span>
                </div>
                {form.pharmacistSignature ? (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                    <img src={form.pharmacistSignature} alt="Pharmacist signature preview" className="h-16 w-auto max-w-[220px] object-contain bg-white rounded-lg border border-slate-100 p-1" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{form.pharmacistName || '—'}</p>
                      <p className="text-xs font-mono text-slate-500">{form.pharmacistRegNo || '—'}</p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-1"><i className="fas fa-check-circle mr-1"></i>Will print on bills</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                    <i className="fas fa-signature text-slate-300 dark:text-slate-600 text-2xl mb-2"></i>
                    <p className="text-xs text-slate-500">No signature uploaded — bills will show name &amp; reg. no. only</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bank & Payment */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs"><i className="fas fa-building-columns"></i></span> Bank &amp; UPI</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">UPI ID</label><input value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} className="glass-input" placeholder="yourname@okbank" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Bank Name</label><input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className="glass-input" placeholder="HDFC Bank" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Bank A/c No</label><input value={form.bankAccountNo} onChange={e => setForm({ ...form, bankAccountNo: e.target.value })} className="glass-input" /></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">IFSC</label><input value={form.bankIfsc} onChange={e => setForm({ ...form, bankIfsc: e.target.value })} className="glass-input uppercase" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Invoice Footer Note</label><textarea value={form.invoiceNote} onChange={e => setForm({ ...form, invoiceNote: e.target.value })} rows={2} className="glass-input" placeholder="Thank you message printed on bills" /></div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-save mr-1"></i>{loading ? 'Saving...' : 'Save Pharmacy Profile'}</button>
        </form>
      </GlassCard>
    </div>
  );
}
