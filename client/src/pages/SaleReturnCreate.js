import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function SaleReturnCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [saleInvoices, setSaleInvoices] = useState([]);
  const [form, setForm] = useState({ saleInvoice: '', customer: '', returnDate: new Date().toISOString().split('T')[0], reason: 'change_of_mind', notes: '', creditNoteNo: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/customers', { params: { limit: 200 } }).then(r => { if (r.success) setCustomers(r.data); });
    API.get('/sale-invoices', { params: { limit: 200 } }).then(r => { if (r.success) setSaleInvoices(r.data); });
  }, []);

  const handleInvoiceSelect = async (invoiceId) => {
    if (!invoiceId) { setItems([]); return; }
    setForm({ ...form, saleInvoice: invoiceId });
    try {
      const res = await API.get(`/sale-invoices/${invoiceId}`);
      if (res.success) {
        setForm(prev => ({ ...prev, customer: res.data.customer?._id || prev.customer }));
        setItems(res.data.items.map(item => ({
          medicine: item.medicine,
          medicineName: item.medicineName,
          batch: item.batch,
          batchNo: item.batchNo,
          expiryDate: item.expiryDate,
          rate: item.rate,
          qty: 0,
          amount: 0,
          gstAmount: 0,
          gstRate: item.gstRate || 12,
          maxQty: item.qty
        })));
      }
    } catch (err) { setError('Failed to load invoice'); }
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'qty') {
      updated[idx].amount = (value || 0) * (updated[idx].rate || 0);
      updated[idx].gstAmount = ((value || 0) * (updated[idx].rate || 0) * (updated[idx].gstRate || 12)) / 100;
    }
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const totalTax = items.reduce((s, i) => s + (i.gstAmount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.qty > 0);
    if (validItems.length === 0) return setError('At least one item with qty > 0 required');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/sale-returns', {
        ...form, items: validItems.map(i => ({ medicine: i.medicine, medicineName: i.medicineName, batch: i.batch, batchNo: i.batchNo, expiryDate: i.expiryDate, qty: i.qty, rate: i.rate, amount: i.amount, gstAmount: i.gstAmount }))
      });
      if (res.success) navigate('/sale-returns');
    } catch (err) { setError(err?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader icon="rotate-left" title="New Sale Return (Credit Note)" subtitle="Return goods from a sales invoice" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Sale Invoice *</label>
              <select value={form.saleInvoice} onChange={e => handleInvoiceSelect(e.target.value)} required className="glass-select">
                <option value="">Select Invoice</option>
                {saleInvoices.map(inv => <option key={inv._id} value={inv._id}>{inv.invoiceNo} - {inv.customerName || 'Walk-in'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Customer</label>
              <input disabled value={form.customer ? customers.find(c => c._id === form.customer)?.name || 'Auto' : 'Auto'} className="glass-input bg-white/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Return Date</label>
              <input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="glass-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Reason</label>
              <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="glass-select">
                <option value="change_of_mind">Change of Mind</option>
                <option value="expired">Expired</option>
                <option value="damaged">Damaged</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Credit Note No</label>
              <input value={form.creditNoteNo} onChange={e => setForm({ ...form, creditNoteNo: e.target.value })} className="glass-input" />
            </div>
          </div>

          {items.length > 0 && (
            <div className="surface-2 rounded-xl overflow-hidden">
              <div className="bg-white/60 backdrop-blur-md px-4 py-3 font-semibold text-sm text-slate-700 border-b border-white/70">Items from Invoice</div>
              <div className="overflow-x-auto">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th className="text-left">Medicine</th>
                      <th className="text-left">Batch</th>
                      <th className="text-right">Rate</th>
                      <th className="text-center">Max</th>
                      <th className="text-center">Return Qty</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{item.medicineName}</td>
                        <td className="p-2">{item.batchNo}</td>
                        <td className="p-2 text-right">{item.rate}</td>
                        <td className="p-2 text-center text-slate-400">{item.maxQty}</td>
                        <td className="p-2 text-center">
                          <input type="number" min={0} max={item.maxQty} value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} className="glass-input w-16 text-center" />
                        </td>
                        <td className="p-2 text-right font-medium">₹{(item.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <div className="w-64 space-y-2 surface-1 rounded-xl p-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal:</span><span className="font-medium text-slate-700">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">GST:</span><span className="font-medium text-slate-700">₹{totalTax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 text-slate-800"><span>Total Credit:</span><span>₹{(subtotal + totalTax).toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="glass-input" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : 'Create Return (Credit Note)'}</button>
            <button type="button" onClick={() => navigate('/sale-returns')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
