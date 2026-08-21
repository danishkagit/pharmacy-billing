import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader } from '../components/ui';

export default function MedicineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const lookupTimer = useRef(null);
  const [form, setForm] = useState({
    name: '', composition: '', manufacturer: '', category: 'tablet', packSize: '', unit: 'nos',
    hsn: '', gstRate: 5, schedule: 'OTC', mrp: 0, reorderLevel: 0, rackLocation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookupHint, setLookupHint] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'name' && !isEdit && value.length >= 2) {
      clearTimeout(lookupTimer.current);
      lookupTimer.current = setTimeout(() => {
        API.get(`/medicines/lookup?q=${encodeURIComponent(value)}`).then(res => {
          if (res.success && res.data) {
            setLookupHint(res.data);
          } else {
            setLookupHint(null);
          }
        }).catch(() => setLookupHint(null));
      }, 300);
    }
    if (name === 'name') setLookupHint(null);
  };

  const applyLookup = () => {
    if (!lookupHint) return;
    setForm(prev => ({
      ...prev,
      composition: lookupHint.composition || prev.composition,
      category: lookupHint.category || prev.category,
      schedule: lookupHint.schedule || prev.schedule,
      gstRate: lookupHint.gstRate || prev.gstRate,
      hsn: lookupHint.hsn || prev.hsn,
      manufacturer: lookupHint.manufacturer || prev.manufacturer,
    }));
    setLookupHint(null);
  };

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
      <PageHeader icon={isEdit ? 'pen' : 'pills'} title={isEdit ? 'Edit Medicine' : 'Add Medicine'} subtitle={isEdit ? 'Update medicine details' : 'Add a new medicine to your inventory'} />
      <div className="app-card p-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-5 border border-red-100">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name *</label>
              <div className="relative">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="app-input"
                  placeholder="e.g., Dolo 500, Crocin 650, Augmentin 625"
                />
                {lookupHint && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button
                      type="button"
                      onClick={applyLookup}
                      className="btn btn-sm btn-primary py-1 px-2 text-[11px]"
                      title="Auto-fill from brand database"
                    >
                      <i className="fas fa-magic mr-1"></i>
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>
              {lookupHint && (
                <div className="mt-2 p-3 rounded-xl bg-pharma-50 border border-pharma-100 animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-check-circle text-pharma-500 text-sm"></i>
                    <span className="text-xs font-medium text-pharma-700">Brand recognized in database</span>
                  </div>
                  <p className="text-sm text-slate-700"><span className="font-medium">Composition:</span> {lookupHint.composition}</p>
                  {lookupHint.manufacturer && <p className="text-xs text-slate-500 mt-0.5">Manufacturer: {lookupHint.manufacturer}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">Click "Auto-fill" to populate composition and other fields</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Composition</label>
              <input name="composition" value={form.composition} onChange={handleChange} className="app-input" placeholder="e.g., Paracetamol IP 500mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange} className="app-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="app-input app-select">
                {['tablet','capsule','syrup','injection','ointment','drop','inhaler','powder','cream','lotion','sachet','other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Schedule *</label>
              <select name="schedule" value={form.schedule} onChange={handleChange} required className="app-input app-select">
                <option value="OTC">OTC (Over the Counter)</option>
                <option value="H">Schedule H (Prescription Required)</option>
                <option value="H1">Schedule H1 (Strict Control)</option>
                <option value="X">Schedule X (Narcotic)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">HSN Code</label>
              <input name="hsn" value={form.hsn} onChange={handleChange} className="app-input" placeholder="e.g., 300490" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GST Rate (%) <span className="text-[10px] text-emerald-600 font-semibold">GST 2.0</span></label>
              <select name="gstRate" value={form.gstRate} onChange={handleChange} className="app-input app-select">
                <option value={0}>0% (Exempt / Life-saving)</option>
                <option value={5}>5% (All medicines)</option>
                <option value={18}>18%</option>
                <option value={40}>40% (Demerit: beverages, pan masala)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
              <input type="number" name="mrp" value={form.mrp} onChange={handleChange} min={0} step="0.01" className="app-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pack Size</label>
              <input name="packSize" value={form.packSize} onChange={handleChange} placeholder="e.g., 10x10" className="app-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input type="number" name="reorderLevel" value={form.reorderLevel} onChange={handleChange} min={0} className="app-input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rack Location</label>
              <input name="rackLocation" value={form.rackLocation} onChange={handleChange} placeholder="e.g., A-14, Shelf 3" className="app-input" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : isEdit ? <><i className="fas fa-save"></i> Update Medicine</> : <><i className="fas fa-plus"></i> Add Medicine</>}
            </button>
            <button type="button" onClick={() => navigate('/medicines')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
