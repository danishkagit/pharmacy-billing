import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function PurchaseInvoiceCreate() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ supplier: '', invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0], discountAmount: 0, freight: 0, notes: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/suppliers', { params: { limit: 200 } }).then(res => { if (res.success) setSuppliers(res.data); });
    API.get('/medicines', { params: { limit: 500 } }).then(res => { if (res.success) setMedicines(res.data); });
  }, []);

  const addItem = () => {
    setItems([...items, { medicine: '', medicineName: '', batchNo: '', mfgDate: '', expiryDate: '', mrp: 0, rate: 0, qty: 1, freeQty: 0, schemeDisc: 0 }]);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'medicine') {
      const med = medicines.find(m => m._id === value);
      if (med) { updated[idx].medicineName = med.name; updated[idx].mrp = med.mrp; }
    }
    if (field === 'qty' || field === 'rate') {
      updated[idx].amount = (updated[idx].qty || 0) * (updated[idx].rate || 0);
    }
    setItems(updated);
  };

  const totals = items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier || items.length === 0) return setError('Supplier and at least one item required');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/purchase-invoices', { ...form, items: items.map(i => ({ ...i, mfgDate: i.mfgDate || undefined, expiryDate: i.expiryDate || undefined })) });
      if (res.success) navigate('/purchases');
    } catch (err) { setError(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Purchase Invoice (GRN)</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
              <input value={form.invoiceNo} onChange={e => setForm({ ...form, invoiceNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
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
                      <th className="p-2 text-left">Batch No</th>
                      <th className="p-2">Expiry</th>
                      <th className="p-2">MRP</th>
                      <th className="p-2">Rate</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Free</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select value={item.medicine} onChange={e => updateItem(idx, 'medicine', e.target.value)} className="w-40 px-2 py-1 border rounded text-sm">
                            <option value="">Select</option>
                            {medicines.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2"><input value={item.batchNo} onChange={e => updateItem(idx, 'batchNo', e.target.value)} className="w-24 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="date" value={item.expiryDate} onChange={e => updateItem(idx, 'expiryDate', e.target.value)} className="w-28 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.mrp} onChange={e => updateItem(idx, 'mrp', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={0} className="w-16 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.freeQty} onChange={e => updateItem(idx, 'freeQty', parseInt(e.target.value) || 0)} min={0} className="w-16 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2 text-right">₹{((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
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
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">₹{totals.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Discount:</span><input type="number" value={form.discountAmount} onChange={e => setForm({ ...form, discountAmount: parseFloat(e.target.value) || 0 })} min={0} className="w-24 px-2 py-1 border rounded text-sm text-right" /></div>
              <div className="flex justify-between text-sm"><span>Freight:</span><input type="number" value={form.freight} onChange={e => setForm({ ...form, freight: parseFloat(e.target.value) || 0 })} min={0} className="w-24 px-2 py-1 border rounded text-sm text-right" /></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t"><span>Total:</span><span>₹{(totals - (form.discountAmount || 0) + (form.freight || 0)).toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Purchase Invoice'}
            </button>
            <button type="button" onClick={() => navigate('/purchases')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
