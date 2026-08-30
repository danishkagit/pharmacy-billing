import { useState, useEffect } from 'react';
import API from '../utils/api';

const DOSAGE_FORMS = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'solution', label: 'Solution' },
  { value: 'drops', label: 'Drops' },
  { value: 'injection', label: 'Injection' },
  { value: 'ointment', label: 'Ointment' },
  { value: 'cream', label: 'Cream' },
  { value: 'lotion', label: 'Lotion' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'powder', label: 'Powder' },
  { value: 'gel', label: 'Gel' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'spray', label: 'Spray' },
  { value: 'suppository', label: 'Suppository' },
  { value: 'other', label: 'Other' },
];

export default function QuickAddMedicine({ open, onClose, onCreated, prefillName = '' }) {
  const [form, setForm] = useState({
    name: prefillName,
    hsn: '',
    manufacturer: '',
    mrp: '',
    category: 'tablet',
    packSize: '',
    gstRate: 5,
    composition: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setForm(prev => ({ ...prev, name: prefillName || prev.name }));
  }, [open, prefillName]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Medicine name is required');
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        hsn: form.hsn.trim(),
        manufacturer: form.manufacturer.trim(),
        mrp: parseFloat(form.mrp) || 0,
        category: form.category,
        packSize: form.packSize.trim(),
        gstRate: parseFloat(form.gstRate) || 5,
        composition: form.composition.trim(),
      };
      const res = await API.post('/medicines', payload);
      if (res.success) {
        onCreated(res.data);
        // Reset form
        setForm({ name: '', hsn: '', manufacturer: '', mrp: '', category: 'tablet', packSize: '', gstRate: 5, composition: '' });
        onClose();
      } else {
        setError(res.error || 'Failed to add medicine');
      }
    } catch (err) {
      setError(err?.error || 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-pills text-pharma-500"></i>
            Quick Add Medicine
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 border border-red-200">
              <i className="fas fa-exclamation-circle"></i>{error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Medicine Name *</label>
              <input
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                required
                className="glass-input"
                placeholder="e.g. Paracetamol 500mg"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">HSN Code</label>
              <input
                value={form.hsn}
                onChange={e => handleChange('hsn', e.target.value)}
                className="glass-input"
                placeholder="e.g. 3004"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GST Rate %</label>
              <input
                type="number"
                value={form.gstRate}
                onChange={e => handleChange('gstRate', e.target.value)}
                min={0}
                max={40}
                className="glass-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Manufacturer</label>
              <input
                value={form.manufacturer}
                onChange={e => handleChange('manufacturer', e.target.value)}
                className="glass-input"
                placeholder="e.g. Cipla Ltd"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">MRP (₹)</label>
              <input
                type="number"
                value={form.mrp}
                onChange={e => handleChange('mrp', e.target.value)}
                min={0}
                step="0.01"
                className="glass-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Dosage Form</label>
              <select
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
                className="glass-select"
              >
                {DOSAGE_FORMS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Packing Type</label>
              <input
                value={form.packSize}
                onChange={e => handleChange('packSize', e.target.value)}
                className="glass-input"
                placeholder="e.g. 10x10, 200ml, 30 tabs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Composition / Salt</label>
              <input
                value={form.composition}
                onChange={e => handleChange('composition', e.target.value)}
                className="glass-input"
                placeholder="e.g. Paracetamol + Caffeine"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow">
              <i className="fas fa-plus mr-1"></i>{loading ? 'Adding...' : 'Add & Select'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
