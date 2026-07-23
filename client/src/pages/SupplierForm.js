import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Drug License No</label><input value={form.dlNo} onChange={e => setForm({ ...form, dlNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Credit Days</label><input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: parseInt(e.target.value) || 0 })} min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label><input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Zone</label><input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : isEdit ? 'Update Supplier' : 'Add Supplier'}</button>
            <button type="button" onClick={() => navigate('/suppliers')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
