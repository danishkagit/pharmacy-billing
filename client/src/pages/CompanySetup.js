import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function CompanySetup() {
  const { company } = useAuth();
  const [form, setForm] = useState({ name: '', legalName: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', gstin: '', pan: '', dlNo: '', fssaiNo: '', dlExpiryDate: '', fssaiExpiryDate: '', drugLicenseCategory: 'both', invoiceNote: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({ name: company.name || '', legalName: company.legalName || '', address: company.address || '', city: company.city || '', state: company.state || '', pincode: company.pincode || '', phone: company.phone || '', email: company.email || '', gstin: company.gstin || '', pan: company.pan || '', dlNo: company.dlNo || '', fssaiNo: company.fssaiNo || '', dlExpiryDate: company.dlExpiryDate ? company.dlExpiryDate.split('T')[0] : '', fssaiExpiryDate: company.fssaiExpiryDate ? company.fssaiExpiryDate.split('T')[0] : '', drugLicenseCategory: company.drugLicenseCategory || 'both', invoiceNote: company.invoiceNote || 'Thank you for your business!' });
    }
  }, [company]);

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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Settings</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {saved && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">Settings saved successfully</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label><input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">PAN</label><input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Drug License No</label><input value={form.dlNo} onChange={e => setForm({ ...form, dlNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">DL Expiry</label><input type="date" value={form.dlExpiryDate} onChange={e => setForm({ ...form, dlExpiryDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">FSSAI No</label><input value={form.fssaiNo} onChange={e => setForm({ ...form, fssaiNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">FSSAI Expiry</label><input type="date" value={form.fssaiExpiryDate} onChange={e => setForm({ ...form, fssaiExpiryDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">License Category</label>
              <select value={form.drugLicenseCategory} onChange={e => setForm({ ...form, drugLicenseCategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="both">Both</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer Note</label><textarea value={form.invoiceNote} onChange={e => setForm({ ...form, invoiceNote: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Settings'}</button>
        </form>
      </div>
    </div>
  );
}
