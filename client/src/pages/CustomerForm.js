import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Customer' : 'Add Customer'}</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"><option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="both">Both</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">PAN</label><input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label><input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Credit Days</label><input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: parseInt(e.target.value) || 0 })} min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}</button>
            <button type="button" onClick={() => navigate('/customers')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
