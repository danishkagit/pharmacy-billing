import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

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
      updated[idx].gstAmount = ((value || 0) * (updated[idx].rate || 0) * 12) / 100;
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Sale Return (Credit Note)</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Invoice *</label>
              <select value={form.saleInvoice} onChange={e => handleInvoiceSelect(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">Select Invoice</option>
                {saleInvoices.map(inv => <option key={inv._id} value={inv._id}>{inv.invoiceNo} - {inv.customerName || 'Walk-in'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input disabled value={form.customer ? customers.find(c => c._id === form.customer)?.name || 'Auto' : 'Auto'} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
              <input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="change_of_mind">Change of Mind</option>
                <option value="expired">Expired</option>
                <option value="damaged">Damaged</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note No</label>
              <input value={form.creditNoteNo} onChange={e => setForm({ ...form, creditNoteNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 font-medium text-sm">Items from Invoice</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Medicine</th>
                      <th className="p-2 text-left">Batch</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-center">Max</th>
                      <th className="p-2 text-center">Return Qty</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{item.medicineName}</td>
                        <td className="p-2">{item.batchNo}</td>
                        <td className="p-2 text-right">{item.rate}</td>
                        <td className="p-2 text-center text-gray-400">{item.maxQty}</td>
                        <td className="p-2 text-center">
                          <input type="number" min={0} max={item.maxQty} value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded text-center" />
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
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>GST:</span><span className="font-medium">₹{totalTax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total Credit:</span><span>₹{(subtotal + totalTax).toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Create Return (Credit Note)'}</button>
            <button type="button" onClick={() => navigate('/sale-returns')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
