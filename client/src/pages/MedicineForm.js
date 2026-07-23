import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';

export default function MedicineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    name: '', composition: '', manufacturer: '', category: 'tablet', packSize: '', unit: 'nos',
    hsn: '', gstRate: 12, schedule: 'OTC', mrp: 0, reorderLevel: 0, rackLocation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      API.get(`/medicines/${id}`).then(res => {
        if (res.success) {
          const m = res.data;
          setForm({ name: m.name, composition: m.composition || '', manufacturer: m.manufacturer || '', category: m.category, packSize: m.packSize || '', unit: m.unit, hsn: m.hsn || '', gstRate: m.gstRate, schedule: m.schedule, mrp: m.mrp, reorderLevel: m.reorderLevel, rackLocation: m.rackLocation || '' });
        }
      }).catch(err => setError(err?.error || 'Failed to load'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = isEdit ? await API.put(`/medicines/${id}`, form) : await API.post('/medicines', form);
      if (res.success) navigate('/medicines');
    } catch (err) {
      setError(err?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Medicine' : 'Add Medicine'}</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Composition</label>
              <input name="composition" value={form.composition} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                {['tablet','capsule','syrup','injection','ointment','drop','inhaler','powder','cream','lotion','sachet','other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule *</label>
              <select name="schedule" value={form.schedule} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="OTC">OTC</option>
                <option value="H">Schedule H (Prescription Required)</option>
                <option value="H1">Schedule H1 (Strict Control)</option>
                <option value="X">Schedule X (Narcotic)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
              <input name="hsn" value={form.hsn} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <select name="gstRate" value={form.gstRate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
              <input type="number" name="mrp" value={form.mrp} onChange={handleChange} min={0} step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size</label>
              <input name="packSize" value={form.packSize} onChange={handleChange} placeholder="e.g., 10x10" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input type="number" name="reorderLevel" value={form.reorderLevel} onChange={handleChange} min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rack Location</label>
              <input name="rackLocation" value={form.rackLocation} onChange={handleChange} placeholder="e.g., A-14, Shelf 3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update Medicine' : 'Add Medicine'}
            </button>
            <button type="button" onClick={() => navigate('/medicines')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
