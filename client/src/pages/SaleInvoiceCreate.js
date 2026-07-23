import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function SaleInvoiceCreate() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [batches, setBatches] = useState({});
  const [form, setForm] = useState({
    type: 'retail', customer: '', customerName: '', customerPhone: '', customerGstin: '',
    prescription: '', prescriptionNo: '', doctorName: '', patientName: '',
    paymentMode: 'cash', isInterState: false, notes: '', notify: true
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeout = useRef(null);

  useEffect(() => {
    API.get('/customers', { params: { limit: 200 } }).then(r => { if (r.success) setCustomers(r.data); });
    API.get('/medicines', { params: { limit: 500 } }).then(r => { if (r.success) setMedicines(r.data); });
    API.get('/prescriptions', { params: { limit: 200 } }).then(r => { if (r.success) setPrescriptions(r.data); });
  }, []);

  const searchMedicines = useCallback((term) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (term.length >= 2) {
        API.get('/medicines', { params: { search: term, limit: 20 } }).then(r => { if (r.success) setMedicines(r.data); });
      }
    }, 300);
  }, []);

  const addItem = () => setItems([...items, { medicine: '', batch: '', batchNo: '', qty: 1, rate: 0, mrp: 0, discountPercent: 0, gstRate: 12 }]);

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleMedicineSelect = async (idx, medicineId) => {
    const med = medicines.find(m => m._id === medicineId);
    if (!med) return;
    const updated = [...items];
    updated[idx] = { ...updated[idx], medicine: medicineId, medicineName: med.name, mrp: med.mrp, gstRate: med.gstRate || 12, schedule: med.schedule };
    if (med.schedule === 'H' || med.schedule === 'H1' || med.schedule === 'X') {
      if (!form.prescription) setError(`⚠ ${med.name} requires a prescription. Please add prescription first.`);
    }
    try {
      const res = await API.get(`/batches/stock/${medicineId}`);
      if (res.success) {
        const batchData = res.data || [];
        setBatches(prev => ({ ...prev, [medicineId]: batchData }));
        if (batchData.length > 0) {
          batchData.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          const best = batchData[0];
          updated[idx] = { ...updated[idx], batch: best._id, batchNo: best.batchNo, rate: best.saleRate || best.purchaseRate, qty: 1, mrp: best.mrp };
          const amt = (updated[idx].qty || 0) * (updated[idx].rate || 0);
          const disc = (amt * (updated[idx].discountPercent || 0)) / 100;
          updated[idx].amount = amt - disc;
        }
      }
    } catch (e) { }
    setItems(updated);
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'batch') {
      const batchData = batches[updated[idx].medicine] || [];
      const b = batchData.find(bb => bb._id === value);
      if (b) { updated[idx].batchNo = b.batchNo; updated[idx].rate = b.saleRate || b.purchaseRate; updated[idx].mrp = b.mrp; }
    }
    const amt = (updated[idx].qty || 0) * (updated[idx].rate || 0);
    const disc = (amt * (updated[idx].discountPercent || 0)) / 100;
    updated[idx].amount = amt - disc;
    setItems(updated);
  };

  const handleCustomerSelect = (customerId) => {
    const c = customers.find(c => c._id === customerId);
    if (c) {
      setForm({ ...form, customer: customerId, customerName: c.name, customerPhone: c.phone || '', customerGstin: c.gstin || '' });
    }
  };

  const handlePrescriptionSelect = (rxId) => {
    const rx = prescriptions.find(p => p._id === rxId);
    if (rx) {
      setForm({ ...form, prescription: rxId, prescriptionNo: rx.prescriptionNo, doctorName: rx.doctorName, patientName: rx.patientName });
    }
  };

  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const totalTax = items.reduce((s, i) => { const amt = (i.amount || 0); return s + (amt * (i.gstRate || 12)) / 100; }, 0);
  const totalAmount = Math.round(subtotal + totalTax);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return setError('At least one item required');
    const invalidItems = items.filter(i => !i.medicine || !i.batch);
    if (invalidItems.length > 0) return setError('All items must have a medicine and batch selected');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/sale-invoices', { ...form, items: items.map(i => ({ medicine: i.medicine, batch: i.batch, batchNo: i.batchNo, qty: i.qty, rate: i.rate, discountPercent: i.discountPercent, mrp: i.mrp })) });
      if (res.success) navigate(`/sales/${res.data._id}`);
    } catch (err) { setError(err?.error || 'Failed to create invoice'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Sale Invoice</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4"><i className="fas fa-exclamation-circle mr-2"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select value={form.customer} onChange={e => handleCustomerSelect(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="credit">Credit</option><option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
              <select value={form.prescription} onChange={e => handlePrescriptionSelect(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="">No Prescription</option>
                {prescriptions.map(p => <option key={p._id} value={p._id}>{p.prescriptionNo} - {p.patientName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
              <input value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 flex items-center justify-between">
              <span className="font-medium text-sm">Sale Items</span>
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
                      <th className="p-2">MRP</th>
                      <th className="p-2">Rate</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Disc%</th>
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
                          <input placeholder="Search..." onChange={e => searchMedicines(e.target.value)} className="w-44 px-2 py-1 mt-1 border rounded text-sm" />
                        </td>
                        <td className="p-2">
                          {item.medicine && batches[item.medicine] ? (
                            <select value={item.batch} onChange={e => updateItem(idx, 'batch', e.target.value)} className="w-36 px-2 py-1 border rounded text-sm">
                              {batches[item.medicine].filter(b => b.qty > 0).map(b => (
                                <option key={b._id} value={b._id}>{b.batchNo} (Qty: {b.qty}, Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN')})</option>
                              ))}
                            </select>
                          ) : (
                            <input value={item.batchNo} onChange={e => updateItem(idx, 'batchNo', e.target.value)} placeholder="Batch" className="w-24 px-2 py-1 border rounded text-sm" />
                          )}
                        </td>
                        <td className="p-2"><input type="number" value={item.mrp} onChange={e => updateItem(idx, 'mrp', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={1} className="w-14 px-2 py-1 border rounded text-sm" /></td>
                        <td className="p-2"><input type="number" value={item.discountPercent} onChange={e => updateItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)} min={0} max={100} className="w-14 px-2 py-1 border rounded text-sm" /></td>
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
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>GST:</span><span className="font-medium">₹{totalTax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total:</span><span>₹{totalAmount.toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 text-lg">
              <i className="fas fa-check-circle mr-2"></i>{loading ? 'Creating...' : `Create Invoice (₹${totalAmount.toFixed(2)})`}
            </button>
            <button type="button" onClick={() => navigate('/sales')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
