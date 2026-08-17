import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import MedicinePicker from '../components/MedicinePicker';
import { PageHeader, GlassCard } from '../components/ui';

export default function PrescriptionForm() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ prescriptionNo: '', doctor: '', patientName: '', patientPhone: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/doctors', { params: { limit: 100 } }).then(r => { if (r.success) setDoctors(r.data); });
  }, []);

  const addItem = () => setItems([...items, { medicine: '', name: '', dosage: '', frequency: '', duration: '', qty: 1 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const selectMedicine = (idx, med) => {
    const u = [...items];
    u[idx] = { ...u[idx], medicine: med._id, name: med.name, dosage: med.composition || '' };
    setItems(u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedDoctor = doctors.find(d => d._id === form.doctor);
      const res = await API.post('/prescriptions', {
        ...form,
        doctorName: selectedDoctor?.name || '',
        doctorRegNo: selectedDoctor?.regNo || '',
        medicines: items.map(i => ({ medicine: i.medicine, name: i.name, dosage: i.dosage, frequency: i.frequency, duration: i.duration, qty: i.qty }))
      });
      if (res.success) navigate('/prescriptions');
    } catch (err) { alert(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Add Prescription" subtitle="Record doctor prescriptions for billing" />
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Prescription No</label>
              <input value={form.prescriptionNo} onChange={e => setForm({ ...form, prescriptionNo: e.target.value })} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Doctor</label>
              <select value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} className="glass-select">
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Patient Name *</label>
              <input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} required className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Patient Phone</label>
              <input value={form.patientPhone} onChange={e => setForm({ ...form, patientPhone: e.target.value })} className="glass-input" />
            </div>
          </div>

          <div className="surface-2 rounded-xl overflow-hidden">
            <div className="bg-white/60 backdrop-blur-md p-3 flex items-center justify-between border-b border-white/70">
              <span className="font-medium text-sm text-slate-700">Medicines</span>
              <button type="button" onClick={addItem} className="btn btn-ghost btn-sm text-pharma-600"><i className="fas fa-plus mr-1"></i>Add</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 p-2 items-end border-b border-white/60">
                <div className="flex-1">
                  {item.medicine ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{item.name}</span>
                      <button type="button" onClick={() => { const u = [...items]; u[idx].medicine = ''; setItems(u); }} className="text-slate-400 hover:text-red-500"><i className="fas fa-sync-alt text-xs"></i></button>
                    </div>
                  ) : (
                    <MedicinePicker compact placeholder="Brand / salt... (pre-fills dosage)" onSelect={(med) => selectMedicine(idx, med)} />
                  )}
                </div>
                <div><input placeholder="Dosage" value={item.dosage} onChange={e => { const u = [...items]; u[idx].dosage = e.target.value; setItems(u); }} className="glass-input w-20 text-sm" /></div>
                <div><input placeholder="Freq" value={item.frequency} onChange={e => { const u = [...items]; u[idx].frequency = e.target.value; setItems(u); }} className="glass-input w-20 text-sm" /></div>
                <div><input placeholder="Duration" value={item.duration} onChange={e => { const u = [...items]; u[idx].duration = e.target.value; setItems(u); }} className="glass-input w-20 text-sm" /></div>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 pb-1"><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="glass-input" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : 'Save Prescription'}</button>
            <button type="button" onClick={() => navigate('/prescriptions')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
