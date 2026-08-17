import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import MedicinePicker from '../components/MedicinePicker';
import { PageHeader, GlassCard } from '../components/ui';

export default function StockAdjustmentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'write_off', reason: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadBatches = async (idx, med) => {
    const medicineId = med?._id || '';
    if (!medicineId) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], medicine: '', medicineName: '', batches: [], selectedBatch: '', batchNo: '', qtyBefore: 0, qtyAfter: 0, rate: 0, difference: 0, amount: 0 };
      setItems(updated);
      return;
    }
    try {
      const res = await API.get(`/batches/stock/${medicineId}`);
      if (res.success) {
        const updated = [...items];
        updated[idx] = { ...updated[idx], medicine: medicineId, medicineName: med?.name || '', batches: res.data || [], selectedBatch: '', batchNo: '', qtyBefore: 0, qtyAfter: 0, rate: 0, difference: 0, amount: 0 };
        setItems(updated);
      }
    } catch (err) { setError('Failed to load batches'); }
  };

  const selectBatch = (idx, batchId) => {
    const updated = [...items];
    const batch = updated[idx].batches.find(b => b._id === batchId);
    if (batch) {
      updated[idx] = {
        ...updated[idx],
        selectedBatch: batchId,
        batch: batch._id,
        batchNo: batch.batchNo,
        qtyBefore: batch.qty || 0,
        qtyAfter: batch.qty || 0,
        rate: batch.rate || batch.mrp || 0,
        expiryDate: batch.expiryDate,
        difference: 0,
        amount: 0
      };
    }
    setItems(updated);
  };

  const updateQtyAfter = (idx, value) => {
    const updated = [...items];
    const qtyAfter = parseInt(value) || 0;
    const difference = qtyAfter - updated[idx].qtyBefore;
    updated[idx] = {
      ...updated[idx],
      qtyAfter,
      difference,
      amount: difference * updated[idx].rate
    };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { medicine: '', medicineName: '', batches: [], selectedBatch: '', batch: '', batchNo: '', expiryDate: '', qtyBefore: 0, qtyAfter: 0, rate: 0, difference: 0, amount: 0 }]);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.medicine && i.batch);
    if (validItems.length === 0) return setError('At least one item with medicine and batch required');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/inventory/adjust', {
        ...form,
        items: validItems.map(i => ({
          medicine: i.medicine,
          medicineName: i.medicineName,
          batch: i.batch,
          batchNo: i.batchNo,
          qtyAfter: i.qtyAfter
        }))
      });
      if (res.success) navigate('/stock-adjustments');
    } catch (err) { setError(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader title="New Stock Adjustment" subtitle="Correct inventory quantities" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required className="glass-select">
                <option value="write_off">Write Off</option>
                <option value="damage">Damage</option>
                <option value="physical_count">Physical Count</option>
                <option value="theft">Theft</option>
                <option value="return_to_supplier">Return to Supplier</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Reason</label>
              <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="glass-input" />
            </div>
          </div>

          <div className="surface-2 rounded-xl overflow-hidden">
            <div className="bg-white/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/70">
              <span className="font-semibold text-sm text-slate-700">Items</span>
              <button type="button" onClick={addItem} className="btn btn-sm btn-secondary text-pharma-600"><i className="fas fa-plus mr-1"></i>Add Item</button>
            </div>
            {items.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <i className="fas fa-balance-scale text-3xl mb-3 text-slate-300"></i>
                <p className="text-sm">No items added yet. Click "Add Item" to start.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th className="text-left">Medicine</th>
                      <th className="text-left">Batch</th>
                      <th className="text-right">Qty Before</th>
                      <th className="text-center">Qty After</th>
                      <th className="text-center">Difference</th>
                      <th className="text-right">Rate</th>
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
                              <button type="button" onClick={() => loadBatches(idx, '')} className="text-slate-400 hover:text-red-500"><i className="fas fa-sync-alt text-xs"></i></button>
                            </div>
                          ) : (
                            <MedicinePicker compact onSelect={(med) => loadBatches(idx, med)} />
                          )}
                        </td>
                        <td className="p-2">
                          <select value={item.selectedBatch} onChange={e => selectBatch(idx, e.target.value)} disabled={!item.medicine} className="glass-select w-36">
                            <option value="">Select</option>
                            {item.batches?.map(b => <option key={b._id} value={b._id}>{b.batchNo} (Qty: {b.qty})</option>)}
                          </select>
                        </td>
                        <td className="p-2 text-right">{item.qtyBefore}</td>
                        <td className="p-2 text-center">
                          <input type="number" min={0} value={item.qtyAfter} onChange={e => updateQtyAfter(idx, e.target.value)} disabled={!item.selectedBatch} className="glass-input w-16 text-center" />
                        </td>
                        <td className={`p-2 text-center font-medium ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : ''}`}>{item.difference}</td>
                        <td className="p-2 text-right">{item.rate}</td>
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
            <div className="w-64 surface-1 rounded-xl p-4">
              <div className="flex justify-between text-lg font-bold text-slate-800"><span>Total Amount:</span><span>₹{items.reduce((s, i) => s + (i.amount || 0), 0).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : 'Save Adjustment'}</button>
            <button type="button" onClick={() => navigate('/stock-adjustments')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}