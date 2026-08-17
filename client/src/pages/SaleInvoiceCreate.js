import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, GlassCard, GlassModal } from '../components/ui';
import MedicinePicker from '../components/MedicinePicker';

export default function SaleInvoiceCreate() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const isRetail = company?.drugLicenseCategory === 'retail' || company?.drugLicenseCategory === 'both';
  const isWholesale = company?.drugLicenseCategory === 'wholesale' || company?.drugLicenseCategory === 'both';

  const [customers, setCustomers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [batches, setBatches] = useState({});
  const [form, setForm] = useState({
    type: isRetail && !isWholesale ? 'retail' : isWholesale && !isRetail ? 'wholesale' : 'retail',
    customer: '', customerName: '', customerPhone: '', customerGstin: '',
    prescription: '', prescriptionNo: '', doctorName: '', patientName: '',
    paymentMode: 'cash', isInterState: false, notes: '', notify: true,
    creditDays: 0, billingAddress: '', deliveryAddress: '',
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: '', phone: '', type: 'retail' });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    API.get('/customers', { params: { limit: 200 } }).then(r => { if (r.success) setCustomers(r.data); });
    API.get('/prescriptions', { params: { limit: 200 } }).then(r => { if (r.success) setPrescriptions(r.data); });
  }, []);

  const addItem = () => setItems([...items, { medicine: '', batch: '', batchNo: '', qty: 1, rate: 0, mrp: 0, discountPercent: 0, gstRate: 12 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleMedicineSelect = async (idx, med) => {
    if (!med || !med._id) return;
    const updated = [...items];
    updated[idx] = { ...updated[idx], medicine: medicineId, medicineName: med.name, mrp: med.mrp, gstRate: med.gstRate || 12, schedule: med.schedule };
    if ((med.schedule === 'H' || med.schedule === 'H1' || med.schedule === 'X') && !form.prescription) {
      setError(`${med.name} requires a prescription. Please add prescription first.`);
    }
    try {
      const res = await API.get(`/batches/stock/${med._id}`);
      if (res.success) {
        const batchData = res.data || [];
        setBatches(prev => ({ ...prev, [med._id]: batchData }));
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
      setError('');
    }
  };

  const handleQuickCustomerAdd = async () => {
    if (!quickCustomer.name.trim()) return;
    try {
      const res = await API.post('/customers', { ...quickCustomer, companyRef: company?._id });
      if (res.success) {
        setCustomers(prev => [...prev, res.data]);
        handleCustomerSelect(res.data._id);
        setShowQuickCustomer(false);
        setQuickCustomer({ name: '', phone: '', type: 'retail' });
      }
    } catch (err) { setError(err?.error || 'Failed to add customer'); }
  };

  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const totalTax = items.reduce((s, i) => { const amt = (i.amount || 0); return s + (amt * (i.gstRate || 12)) / 100; }, 0);
  const totalAmount = Math.round(subtotal + totalTax);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return setError('At least one item required');
    const invalidItems = items.filter(i => !i.medicine || !i.batch);
    if (invalidItems.length > 0) return setError('All items must have a medicine and batch selected');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('customer', form.customer);
      formData.append('customerName', form.customerName);
      formData.append('customerPhone', form.customerPhone);
      formData.append('customerGstin', form.customerGstin);
      formData.append('prescription', form.prescription);
      formData.append('prescriptionNo', form.prescriptionNo);
      formData.append('doctorName', form.doctorName);
      formData.append('patientName', form.patientName);
      formData.append('invoiceDate', form.invoiceDate || new Date());
      formData.append('dueDate', form.dueDate);
      formData.append('paymentMode', form.paymentMode);
      formData.append('isInterState', String(form.isInterState));
      formData.append('notes', form.notes);
      formData.append('creditDays', String(form.creditDays));
      formData.append('billingAddress', form.billingAddress);
      formData.append('deliveryAddress', form.deliveryAddress);
      if (selectedFile) formData.append('billFile', selectedFile);
      items.forEach((item, idx) => {
        formData.append(`items[${idx}][medicine]`, item.medicine || '');
        formData.append(`items[${idx}][batch]`, item.batch || '');
        formData.append(`items[${idx}][batchNo]`, item.batchNo || '');
        formData.append(`items[${idx}][qty]`, String(item.qty || 1));
        formData.append(`items[${idx}][rate]`, String(item.rate || 0));
        formData.append(`items[${idx}][discountPercent]`, String(item.discountPercent || 0));
        formData.append(`items[${idx}][mrp]`, String(item.mrp || 0));
      });
      const res = await API.post('/sale-invoices', formData, { headers: { 'Content-Type': false } });
      if (res.success) navigate(`/sales/${res.data._id}`);
    } catch (err) { setError(err?.error || 'Failed to create invoice'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={form.type === 'retail' ? 'New Retail Sale' : 'New Wholesale Invoice'}
        subtitle="Create a new sale invoice with medicine items">
        <div className="flex gap-2">
          {isRetail && isWholesale && (
            <div className="glass-tabs inline-flex bg-white/60 border border-gray-200/60 rounded-morph-xs p-0.5">
              <button type="button" onClick={() => setForm({ ...form, type: 'retail' })}
                className={`px-3 py-1.5 rounded-morph-xs text-xs font-medium transition-all ${form.type === 'retail' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                <i className="fas fa-store mr-1"></i>Retail
              </button>
              <button type="button" onClick={() => setForm({ ...form, type: 'wholesale' })}
                className={`px-3 py-1.5 rounded-morph-xs text-xs font-medium transition-all ${form.type === 'wholesale' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                <i className="fas fa-warehouse mr-1"></i>Wholesale
              </button>
            </div>
          )}
        </div>
      </PageHeader>

      <GlassCard>
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-morph-xs text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>{error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bill File</label>
            <input type="file" onChange={handleFileChange} className="glass-input w-full" />
            {selectedFile && <p className="text-xs text-slate-500 mt-1">Selected: {selectedFile.name}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
              <div className="flex gap-1">
                <select value={form.customer} onChange={e => handleCustomerSelect(e.target.value)} className="glass-select flex-1">
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                </select>
                {isRetail && (
                  <button type="button" onClick={() => setShowQuickCustomer(true)} className="btn-ghost px-2" title="Quick Add Customer">
                    <i className="fas fa-plus"></i>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone / GSTIN</label>
              <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="Phone" className="glass-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })} className="glass-select">
                <option value="cash">Cash</option><option value="upi">UPI</option>
                <option value="card">Card</option><option value="credit">Credit</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            {form.type === 'wholesale' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Credit Days</label>
                <input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: parseInt(e.target.value) || 0 })}
                  min={0} className="glass-input text-sm" placeholder="0" />
              </div>
            )}
          </div>

          {/* Prescription Info (retail) */}
          {(isRetail || form.type === 'retail') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prescription</label>
                <select value={form.prescription} onChange={e => handlePrescriptionSelect(e.target.value)} className="glass-select">
                  <option value="">No Prescription</option>
                  {prescriptions.map(p => <option key={p._id} value={p._id}>{p.prescriptionNo} - {p.patientName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Doctor Name</label>
                <input value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} className="glass-input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Patient Name</label>
                <input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} className="glass-input text-sm" />
              </div>
            </div>
          )}

          {/* Wholesale extra fields */}
          {form.type === 'wholesale' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Billing Address</label>
                <input value={form.billingAddress} onChange={e => setForm({ ...form, billingAddress: e.target.value })} className="glass-input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Address</label>
                <input value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} className="glass-input text-sm" />
              </div>
            </div>
          )}

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Sale Items</span>
              <button type="button" onClick={addItem} className="btn-primary text-xs py-1.5 px-3">
                <i className="fas fa-plus"></i> Add Item
              </button>
            </div>

            <GlassCard className="overflow-hidden p-0">
              {items.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <i className="fas fa-cart-plus text-2xl mb-2"></i>
                  <p className="text-sm">No items added yet</p>
                  <button type="button" onClick={addItem} className="text-primary-500 text-xs hover:underline mt-1">Add the first item</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-wrap">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Batch</th>
                        <th>MRP</th>
                        <th>Rate</th>
                        <th>Qty</th>
                        <th>Disc%</th>
                        <th className="text-right">Amount</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            {item.medicine ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-700 truncate max-w-[160px]">{item.medicineName}</span>
                                <button type="button" onClick={() => { const u = [...items]; u[idx].medicine = ''; u[idx].medicineName = ''; u[idx].batch = ''; setItems(u); }} className="text-slate-400 hover:text-red-500 text-xs" title="Change medicine"><i className="fas fa-sync-alt"></i></button>
                              </div>
                            ) : (
                              <MedicinePicker
                                compact
                                placeholder="Brand / salt (min 3)..."
                                onSelect={(med) => handleMedicineSelect(idx, med)}
                                autoFocus={items.length === 1 && idx === 0}
                              />
                            )}
                          </td>
                          <td>
                            {item.medicine && batches[item.medicine] ? (
                              <select value={item.batch} onChange={e => updateItem(idx, 'batch', e.target.value)} className="glass-select text-xs py-1.5 w-36">
                                {batches[item.medicine].filter(b => b.qty > 0).map(b => (
                                  <option key={b._id} value={b._id}>{b.batchNo} (Qty:{b.qty})</option>
                                ))}
                              </select>
                            ) : (
                              <input value={item.batchNo} onChange={e => updateItem(idx, 'batchNo', e.target.value)} placeholder="Batch" className="glass-input text-xs py-1.5 w-24" />
                            )}
                          </td>
                          <td><input type="number" value={item.mrp} onChange={e => updateItem(idx, 'mrp', parseFloat(e.target.value) || 0)} className="glass-input text-xs py-1.5 w-16 text-center" /></td>
                          <td><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="glass-input text-xs py-1.5 w-16 text-center" /></td>
                          <td><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={1} className="glass-input text-xs py-1.5 w-14 text-center" /></td>
                          <td><input type="number" value={item.discountPercent} onChange={e => updateItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)} min={0} max={100} className="glass-input text-xs py-1.5 w-14 text-center" /></td>
                          <td className="text-right font-medium text-sm">₹{(item.amount || 0).toFixed(2)}</td>
                          <td><button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1"><i className="fas fa-times"></i></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 bg-gray-50/50 rounded-morph-xs p-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST:</span><span className="font-medium">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-200">
                <span>Total:</span><span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Submit */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="glass-input text-sm resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="btn-primary text-base px-8 py-3">
              <i className="fas fa-check-circle"></i>
              {loading ? 'Creating...' : `Create ${form.type === 'retail' ? 'Sale' : 'Invoice'} (₹${totalAmount.toFixed(2)})`}
            </button>
            <button type="button" onClick={() => navigate('/sales')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>

      {/* Quick Customer Modal */}
      <GlassModal open={showQuickCustomer} onClose={() => setShowQuickCustomer(false)} title="Quick Add Customer" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
            <input value={quickCustomer.name} onChange={e => setQuickCustomer({ ...quickCustomer, name: e.target.value })}
              className="glass-input" placeholder="Customer name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input value={quickCustomer.phone} onChange={e => setQuickCustomer({ ...quickCustomer, phone: e.target.value })}
              className="glass-input" placeholder="Phone number" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select value={quickCustomer.type} onChange={e => setQuickCustomer({ ...quickCustomer, type: e.target.value })} className="glass-select">
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowQuickCustomer(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleQuickCustomerAdd} className="btn-primary">
              <i className="fas fa-plus"></i> Add Customer
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
