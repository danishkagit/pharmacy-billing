import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function StockAdjustmentCreate() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ type: 'write_off', reason: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/medicines', { params: { limit: 500 } }).then(res => { if (res.success) setMedicines(res.data); });
  }, []);

  const loadBatches = async (idx, medicineId) => {
    if (!medicineId) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], medicine: '', medicineName: '', batches: [], selectedBatch: '', batchNo: '', qtyBefore: 0, qtyAfter: 0, rate: 0, difference: 0, amount: 0 };
      setItems(updated);
      return;
    }
    try {
      const res = await API.get(`/batches/stock/${medicineId}`);
      if (res.success) {
        const med = medicines.find(m => m._id === medicineId);
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Stock Adjustment</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="write_off">Write Off</option>
                <option value="damage">Damage</option>
                <option value="physical_count">Physical Count</option>
                <option value="theft">Theft</option>
                <option value="return_to_supplier">Return to Supplier</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 flex items-center justify-between">
              <span className="font-medium text-sm">Items</span>
              <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline"><i className="fas fa-plus mr-1"></i>Add Item</button>
            </div>
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No items added. Click "Add Item" to start.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Medicine</th>
                      <th className="p-2 text-left">Batch</th>
                      <th className="p-2 text-right">Qty Before</th>
                      <th className="p-2 text-center">Qty After</th>
                      <th className="p-2 text-center">Difference</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select value={item.medicine} onChange={e => loadBatches(idx, e.target.value)} className="w-40 px-2 py-1 border rounded text-sm">
                            <option value="">Select</option>
                            {medicines.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select value={item.selectedBatch} onChange={e => selectBatch(idx, e.target.value)} disabled={!item.medicine} className="w-32 px-2 py-1 border rounded text-sm">
                            <option value="">Select</option>
                            {item.batches?.map(b => <option key={b._id} value={b._id}>{b.batchNo} (Qty: {b.qty})</option>)}
                          </select>
                        </td>
                        <td className="p-2 text-right">{item.qtyBefore}</td>
                        <td className="p-2 text-center">
                          <input type="number" min={0} value={item.qtyAfter} onChange={e => updateQtyAfter(idx, e.target.value)} disabled={!item.selectedBatch} className="w-16 px-2 py-1 border rounded text-center text-sm" />
                        </td>
                        <td className={`p-2 text-center font-medium ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : ''}`}>{item.difference}</td>
                        <td className="p-2 text-right">{item.rate}</td>
                        <td className="p-2 text-right font-medium">₹{(item.amount || 0).toFixed(2)}</td>
                        <td className="p-2"><button type="button" onClick={() => removeItem(idx)} className="text-red-500"><i className="fas fa-times"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total Amount:</span><span>₹{items.reduce((s, i) => s + (i.amount || 0), 0).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Adjustment'}</button>
            <button type="button" onClick={() => navigate('/stock-adjustments')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}