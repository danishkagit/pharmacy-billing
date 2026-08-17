import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import MedicinePicker from '../components/MedicinePicker';
import { PageHeader, GlassCard } from '../components/ui';

export default function PurchaseOrderCreate() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ supplier: '', orderDate: new Date().toISOString().split('T')[0], expectedDate: '', discount: 0 });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/suppliers', { params: { limit: 200 } }).then(res => { if (res.success) setSuppliers(res.data); });
  }, []);

  const addItem = () => setItems([...items, { medicine: '', medicineName: '', qty: 1, rate: 0, amount: 0 }]);

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'qty' || field === 'rate') {
      updated[idx].amount = (updated[idx].qty || 0) * (updated[idx].rate || 0);
    }
    setItems(updated);
  };

  const selectMedicine = (idx, med) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], medicine: med._id, medicineName: med.name };
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const discount = form.discount || 0;
  const taxAmount = subtotal * 0.12;
  const totalAmount = subtotal - discount + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier) return setError('Supplier is required');
    if (items.length === 0) return setError('At least one item required');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/purchase-orders', {
        ...form,
        discount,
        items: items.map(i => ({ medicine: i.medicine, medicineName: i.medicineName, qty: i.qty, rate: i.rate }))
      });
      if (res.success) navigate('/purchase-orders');
    } catch (err) { setError(err?.error || 'Failed to create purchase order'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="New Purchase Order" subtitle="Raise a purchase order to a supplier" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Supplier *</label>
              <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} required className="glass-select">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Order Date</label>
              <input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Expected Date</label>
              <input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} className="glass-input" />
            </div>
          </div>

          <div className="surface-2 rounded-xl overflow-hidden">
            <div className="bg-white/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/70">
              <span className="font-semibold text-sm text-slate-700">Order Items</span>
              <button type="button" onClick={addItem} className="btn btn-sm btn-secondary text-pharma-600"><i className="fas fa-plus mr-1"></i>Add Item</button>
            </div>
            {items.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <i className="fas fa-cart-plus text-3xl mb-3 text-slate-300"></i>
                <p className="text-sm mb-2">No items added yet.</p>
                <button type="button" onClick={addItem} className="text-pharma-600 hover:underline text-sm font-medium">Add the first item</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th className="text-left">Medicine</th>
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
              <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{item.medicineName}</span>
              <button type="button" onClick={() => { const u = [...items]; u[idx].medicine = ''; setItems(u); }} className="text-slate-400 hover:text-red-500"><i className="fas fa-sync-alt text-xs"></i></button>
            </div>
          ) : (
            <MedicinePicker compact onSelect={(med) => selectMedicine(idx, med)} />
          )}
        </td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={1} className="glass-input w-16" /></td>
                        <td className="p-2"><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} min={0} step="0.01" className="glass-input w-20" /></td>
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
            <div className="w-72 space-y-2 surface-1 rounded-xl p-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal:</span><span className="font-medium text-slate-700">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Discount:</span><input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} min={0} step="0.01" className="glass-input w-24 text-right" /></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">GST (12%):</span><span className="font-medium text-slate-700">₹{taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 text-slate-800"><span>Total:</span><span>₹{totalAmount.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow">
              <i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : 'Create Purchase Order'}
            </button>
            <button type="button" onClick={() => navigate('/purchase-orders')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
