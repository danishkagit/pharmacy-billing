import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import MedicinePicker from '../components/MedicinePicker';
import { PageHeader, GlassCard } from '../components/ui';

export default function TransferCreate() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState({});
  const [form, setForm] = useState({ fromBranch: '', toBranch: '', transferDate: new Date().toISOString().split('T')[0], challanNo: '', notes: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/branches', { params: { limit: 200 } }).then(r => { if (r.success) setBranches(r.data); });
  }, []);

  const addItem = () => setItems([...items, { medicine: '', medicineName: '', batch: '', batchNo: '', expiryDate: '', qty: 1, rate: 0, amount: 0 }]);

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleMedicineSelect = async (idx, med) => {
    const medicineId = med?._id || '';
    if (!medicineId) { const u=[...items]; u[idx]={...u[idx], medicine:'', medicineName:''}; setItems(u); return; }
    const updated = [...items];
    updated[idx] = { ...updated[idx], medicine: medicineId, medicineName: med.name, batch: '', batchNo: '', expiryDate: '', qty: 1 };
    try {
      const res = await API.get(`/batches/stock/${medicineId}`);
      if (res.success) {
        const batchData = res.data || [];
        setBatches(prev => ({ ...prev, [medicineId]: batchData }));
        if (batchData.length > 0) {
          batchData.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          const best = batchData[0];
          updated[idx] = { ...updated[idx], batch: best._id, batchNo: best.batchNo, expiryDate: best.expiryDate, rate: best.saleRate || best.purchaseRate || 0 };
        }
      }
    } catch (e) { }
    updated[idx].amount = (updated[idx].qty || 0) * (updated[idx].rate || 0);
    setItems(updated);
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'batch') {
      const batchData = batches[updated[idx].medicine] || [];
      const b = batchData.find(bb => bb._id === value);
      if (b) { updated[idx].batchNo = b.batchNo; updated[idx].expiryDate = b.expiryDate; updated[idx].rate = b.saleRate || b.purchaseRate || updated[idx].rate; }
    }
    if (field === 'qty' || field === 'rate' || field === 'batch') {
      updated[idx].amount = (updated[idx].qty || 0) * (updated[idx].rate || 0);
    }
    setItems(updated);
  };

  const totalItems = items.length;
  const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromBranch) return setError('Please select source branch');
    if (!form.toBranch) return setError('Please select destination branch');
    if (form.fromBranch === form.toBranch) return setError('Source and destination branches must be different');
    if (items.length === 0) return setError('At least one item required');
    const invalid = items.filter(i => !i.medicine || !i.batch);
    if (invalid.length > 0) return setError('All items must have a medicine and batch selected');
    setLoading(true);
    setError('');
    try {
      const payload = {
        fromBranch: form.fromBranch,
        toBranch: form.toBranch,
        transferDate: form.transferDate,
        challanNo: form.challanNo,
        notes: form.notes,
        items: items.map(i => ({ medicine: i.medicine, medicineName: i.medicineName, batch: i.batch, batchNo: i.batchNo, expiryDate: i.expiryDate, qty: i.qty, rate: i.rate }))
      };
      const res = await API.post('/transfers', payload);
      if (res.success) navigate('/transfers');
    } catch (err) { setError(err?.error || 'Failed to create transfer'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="New Inter-Branch Transfer" subtitle="Move stock from one branch to another" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">From Branch</label>
              <select value={form.fromBranch} onChange={e => setForm({ ...form, fromBranch: e.target.value })} className="glass-select">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">To Branch</label>
              <select value={form.toBranch} onChange={e => setForm({ ...form, toBranch: e.target.value })} className="glass-select">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Transfer Date</label>
              <input type="date" value={form.transferDate} onChange={e => setForm({ ...form, transferDate: e.target.value })} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Challan No</label>
              <input value={form.challanNo} onChange={e => setForm({ ...form, challanNo: e.target.value })} className="glass-input" placeholder="Optional" />
            </div>
          </div>

          <div className="surface-2 rounded-xl overflow-hidden">
            <div className="bg-white/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/70">
              <span className="font-semibold text-sm text-slate-700">Transfer Items</span>
              <button type="button" onClick={addItem} className="btn btn-sm btn-secondary text-pharma-600"><i className="fas fa-plus mr-1"></i>Add Item</button>
            </div>
            {items.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <i className="fas fa-truck text-3xl mb-3 text-slate-300"></i>
                <p className="text-sm mb-2">No items yet.</p>
                <button type="button" onClick={addItem} className="text-pharma-600 hover:underline text-sm font-medium">Add the first item</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th className="text-left">Medicine</th>
                      <th className="text-left">Batch</th>
                      <th>Expiry</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th className="text-right">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          {item.medicine ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{item.medicineName}</span>
                              <button type="button" onClick={() => handleMedicineSelect(idx, '')} className="text-slate-400 hover:text-red-500"><i className="fas fa-sync-alt text-xs"></i></button>
                            </div>
                          ) : (
                            <MedicinePicker compact onSelect={(med) => handleMedicineSelect(idx, med)} />
                          )}
                        </td>
                        <td className="p-2">
                          {item.medicine && batches[item.medicine] ? (
                            <select value={item.batch} onChange={e => updateItem(idx, 'batch', e.target.value)} className="glass-select w-40">
                              <option value="">Select Batch</option>
                              {batches[item.medicine].filter(b => b.qty > 0).map(b => (
                                <option key={b._id} value={b._id}>{b.batchNo} (Qty: {b.qty}, Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN')})</option>
                              ))}
                            </select>
                          ) : (
                            <input value={item.batchNo} onChange={e => updateItem(idx, 'batchNo', e.target.value)} placeholder="Batch No" className="glass-input w-28" />
                          )}
                        </td>
                        <td className="p-2">
                          <input type="date" value={item.expiryDate ? item.expiryDate.split('T')[0] : ''} onChange={e => updateItem(idx, 'expiryDate', e.target.value)} className="glass-input w-32" />
                        </td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={1} className="glass-input w-16" /></td>
                        <td className="p-2"><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="glass-input w-20" /></td>
                        <td className="p-2 text-right font-medium">₹{(item.amount || 0).toFixed(2)}</td>
                        <td className="p-2 text-center"><button type="button" onClick={() => removeItem(idx)} className="btn btn-ghost btn-sm text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 surface-1 rounded-xl p-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Items:</span><span className="font-medium text-slate-700">{totalItems}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 text-slate-800"><span>Total Amount:</span><span>₹{totalAmount.toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="glass-input" placeholder="Optional notes" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow">
              <i className="fas fa-check-circle mr-1"></i>{loading ? 'Creating...' : 'Create Transfer'}
            </button>
            <button type="button" onClick={() => navigate('/transfers')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
