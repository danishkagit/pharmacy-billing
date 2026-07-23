import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function PrescriptionForm() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ prescriptionNo: '', doctor: '', patientName: '', patientPhone: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/doctors', { params: { limit: 100 } }).then(r => { if (r.success) setDoctors(r.data); });
    API.get('/medicines', { params: { limit: 300 } }).then(r => { if (r.success) setMedicines(r.data); });
  }, []);

  const addItem = () => setItems([...items, { medicine: '', dosage: '', frequency: '', duration: '', qty: 1 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedDoctor = doctors.find(d => d._id === form.doctor);
      const res = await API.post('/prescriptions', {
        ...form,
        doctorName: selectedDoctor?.name || '',
        doctorRegNo: selectedDoctor?.regNo || '',
        medicines: items.map(i => ({ medicine: i.medicine, name: medicines.find(m => m._id === i.medicine)?.name || '', dosage: i.dosage, frequency: i.frequency, duration: i.duration, qty: i.qty }))
      });
      if (res.success) navigate('/prescriptions');
    } catch (err) { alert(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Prescription</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription No</label>
              <input value={form.prescriptionNo} onChange={e => setForm({ ...form, prescriptionNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
              <input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Phone</label>
              <input value={form.patientPhone} onChange={e => setForm({ ...form, patientPhone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 flex items-center justify-between">
              <span className="font-medium text-sm">Medicines</span>
              <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline"><i className="fas fa-plus mr-1"></i>Add</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 p-2 items-end border-b">
                <div className="flex-1">
                  <select value={item.medicine} onChange={e => { const u = [...items]; u[idx].medicine = e.target.value; setItems(u); }} className="w-full px-2 py-1 border rounded text-sm">
                    <option value="">Select</option>
                    {medicines.filter(m => m.schedule !== 'OTC' || true).map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div><input placeholder="Dosage" value={item.dosage} onChange={e => { const u = [...items]; u[idx].dosage = e.target.value; setItems(u); }} className="w-20 px-2 py-1 border rounded text-sm" /></div>
                <div><input placeholder="Freq" value={item.frequency} onChange={e => { const u = [...items]; u[idx].frequency = e.target.value; setItems(u); }} className="w-20 px-2 py-1 border rounded text-sm" /></div>
                <div><input placeholder="Duration" value={item.duration} onChange={e => { const u = [...items]; u[idx].duration = e.target.value; setItems(u); }} className="w-20 px-2 py-1 border rounded text-sm" /></div>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 pb-1"><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Prescription'}</button>
            <button type="button" onClick={() => navigate('/prescriptions')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
