import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function TransferCreate() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState({});
  const [form, setForm] = useState({ fromBranch: '', toBranch: '', transferDate: new Date().toISOString().split('T')[0], challanNo: '', notes: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/branches', { params: { limit: 200 } }).then(r => { if (r.success) setBranches(r.data); });
    API.get('/medicines', { params: { limit: 500 } }).then(r => { if (r.success) setMedicines(r.data); });
  }, []);

  const addItem = () => setItems([...items, { medicine: '', medicineName: '', batch: '', batchNo: '', expiryDate: '', qty: 1, rate: 0, amount: 0 }]);

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleMedicineSelect = async (idx, medicineId) => {
    const med = medicines.find(m => m._id === medicineId);
    if (!med) return;
    const updated = [...items];
    updated[idx] = { ...updated[idx], medicine: medicineId, medicineName: med.name, batch: '', batchNo: '', expiryDate: '', rate: med.saleRate || med.purchaseRate || 0, qty: 1 };
    try {
      const res = await API.get(`/batches/stock/${medicineId}`);
      if (res.success) {
        const batchData = res.data || [];
        setBatches(prev => ({ ...prev, [medicineId]: batchData }));
        if (batchData.length > 0) {
          batchData.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          const best = batchData[0];
          updated[idx] = { ...updated[idx], batch: best._id, batchNo: best.batchNo, expiryDate: best.expiryDate, rate: best.saleRate || best.purchaseRate || updated[idx].rate };
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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Inter-Branch Transfer</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4"><i className="fas fa-exclamation-circle mr-2"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Branch</label>
              <select value={form.fromBranch} onChange={e => setForm({ ...form, fromBranch: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Branch</label>
              <select value={form.toBranch} onChange={e => setForm({ ...form, toBranch: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
              <input type="date" value={form.transferDate} onChange={e => setForm({ ...form, transferDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan No</label>
              <input value={form.challanNo} onChange={e => setForm({ ...form, challanNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Optional" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 flex items-center justify-between">
              <span className="font-medium text-sm">Transfer Items</span>
              <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline"><i className="fas fa-plus mr-1"></i>Add Item</button>
            </div>
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No items. <button type="button" onClick={addItem} className="text-blue-600 hover:underline">Add the first item</button></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Medicine</th>
                      <th className="p-2 text-left">Batch</th>
                      <th className="p-2">Expiry</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select value={item.medicine} onChange={e => handleMedicineSelect(idx, e.target.value)} className="w-44 px-2 py-1 border rounded text-sm">
                            <option value="">Select</option>
                            {medicines.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          {item.medicine && batches[item.medicine] ? (
                            <select value={item.batch} onChange={e => updateItem(idx, 'batch', e.target.value)} className="w-36 px-2 py-1 border rounded text-sm">
                              <option value="">Select Batch</option>
                              {batches[item.medicine].filter(b => b.qty > 0).map(b => (
                                <option key={b._id} value={b._id}>{b.batchNo} (Qty: {b.qty}, Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN')})</option>
                              ))}
                            </select>
                          ) : (
                            <input value={item.batchNo} onChange={e => updateItem(idx, 'batchNo', e.target.value)} placeholder="Batch No" className="w-24 px-2 py-1 border rounded text-sm" />
                          )}
                        </td>
                        <td className="p-2">
                          <input type="date" value={item.expiryDate ? item.expiryDate.split('T')[0] : ''} onChange={e => updateItem(idx, 'expiryDate', e.target.value)} className="w-28 px-2 py-1 border rounded text-sm" />
                        </td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={1} className="w-14 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" /></td>
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
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span>Total Items:</span><span className="font-medium">{totalItems}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total Amount:</span><span>₹{totalAmount.toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none text-sm" placeholder="Optional notes" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 text-lg">
              <i className="fas fa-check-circle mr-2"></i>{loading ? 'Creating...' : 'Create Transfer'}
            </button>
            <button type="button" onClick={() => navigate('/transfers')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
