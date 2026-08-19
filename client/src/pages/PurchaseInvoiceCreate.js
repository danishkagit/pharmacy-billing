import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import MedicinePicker from '../components/MedicinePicker';
import { PageHeader, GlassCard } from '../components/ui';

export default function PurchaseInvoiceCreate() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ supplier: '', invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0], discountAmount: 0, discountPercent: 0, freight: 0, notes: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [templateMsg, setTemplateMsg] = useState('');
  const templateInputRef = useRef(null);

  useEffect(() => {
    API.get('/suppliers', { params: { limit: 200 } }).then(res => { if (res.success) setSuppliers(res.data); });
  }, []);

  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!form.supplier) return setTemplateMsg('Select a supplier first, then upload the CSV.');
    setParsing(true);
    setTemplateMsg('');
    try {
      const fd = new FormData();
      fd.append('templateFile', file);
      const res = await API.post('/purchase-invoices/parse-csv', fd, { headers: { 'Content-Type': false } });
      if (res.success) {
        const d = res.data;
        setItems(d.items.map(i => ({
          medicine: i.medicine,
          medicineName: i.medicineName,
          batchNo: i.batchNo,
          mfgDate: '',
          expiryDate: i.expiryDate,
          mrp: i.mrp,
          rate: i.rate,
          qty: i.qty,
          freeQty: i.freeQty,
          schemeDisc: i.schemeDisc,
          gstRate: i.gstRate
        })));
        if (d.invoiceDate) setForm(f => ({ ...f, invoiceDate: d.invoiceDate }));
        if (d.invoiceNo) setForm(f => ({ ...f, invoiceNo: d.invoiceNo }));
        if (d.freight || d.platformFees || d.codCharges) setForm(f => ({ ...f, freight: +(d.freight + d.platformFees + d.codCharges).toFixed(2) }));
        const newTotals = d.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
        setForm(f => ({ ...f, discountAmount: newTotals > 0 ? Math.round(newTotals * (f.discountPercent || 0) / 100 * 100) / 100 : 0 }));
        setTemplateMsg(`Parsed ${d.total} items from ${file.name} (${d.matched} matched to stock). Review, link any unmatched, then save.`);
      } else {
        setTemplateMsg(res.error || 'Parsing failed');
      }
    } catch (err) {
      setTemplateMsg(err?.error || 'Failed to parse template');
    } finally {
      setParsing(false);
    }
  };

  const addItem = () => {
    setItems([...items, { medicine: '', medicineName: '', batchNo: '', mfgDate: '', expiryDate: '', mrp: 0, rate: 0, qty: 1, freeQty: 0, schemeDisc: 0 }]);
  };

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
    updated[idx] = { ...updated[idx], medicine: med._id, medicineName: med.name, mrp: med.mrp, gstRate: med.gstRate };
    setItems(updated);
  };

  const totals = items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);

  const updateDiscountPercent = (pct) => {
    const amt = totals > 0 ? (totals * pct) / 100 : 0;
    setForm(f => ({ ...f, discountPercent: pct, discountAmount: Math.round(amt * 100) / 100 }));
  };

  const updateDiscountAmount = (amt) => {
    const pct = totals > 0 ? (amt / totals) * 100 : 0;
    setForm(f => ({ ...f, discountAmount: amt, discountPercent: Math.round(pct * 100) / 100 }));
  };

  const handleSupplierChange = (e) => {
    const val = e.target.value;
    const s = suppliers.find(x => x._id === val);
    const pct = s?.defaultDiscountPercent || 0;
    const amt = totals > 0 ? (totals * pct) / 100 : 0;
    setForm(f => ({ ...f, supplier: val, discountPercent: pct, discountAmount: Math.round(amt * 100) / 100 }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier || items.length === 0) return setError('Supplier and at least one item required');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('supplier', form.supplier);
      formData.append('invoiceNo', form.invoiceNo);
      formData.append('invoiceDate', form.invoiceDate);
      formData.append('discountAmount', String(form.discountAmount));
      formData.append('freight', String(form.freight));
      formData.append('notes', form.notes);
      if (selectedFile) formData.append('billFile', selectedFile);
      items.forEach((item, idx) => {
        formData.append(`items[${idx}][medicine]`, item.medicine || '');
        formData.append(`items[${idx}][medicineName]`, item.medicineName || '');
        formData.append(`items[${idx}][batchNo]`, item.batchNo || '');
        formData.append(`items[${idx}][mfgDate]`, item.mfgDate || '');
        formData.append(`items[${idx}][expiryDate]`, item.expiryDate || '');
        formData.append(`items[${idx}][mrp]`, String(item.mrp || 0));
        formData.append(`items[${idx}][rate]`, String(item.rate || 0));
        formData.append(`items[${idx}][qty]`, String(item.qty || 0));
        formData.append(`items[${idx}][freeQty]`, String(item.freeQty || 0));
        formData.append(`items[${idx}][schemeDisc]`, String(item.schemeDisc || 0));
        formData.append(`items[${idx}][gstRate]`, String(item.gstRate || 0));
      });
      const res = await API.post('/purchase-invoices', formData, { headers: { 'Content-Type': false } });
      if (res.success) navigate('/purchases');
    } catch (err) { setError(err?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon="file-invoice" title="New Purchase Invoice (GRN)" subtitle="Record goods received and create batches" />
      <GlassCard>
        {error && <div className="animate-fade-up bg-red-50/80 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Supplier *</label>
              <select value={form.supplier} onChange={handleSupplierChange} required className="glass-select">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Invoice No</label>
              <input value={form.invoiceNo} onChange={e => setForm({ ...form, invoiceNo: e.target.value })} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className="glass-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Bill File *</label>
              <input type="file" onChange={handleFileChange} className="glass-input w-full" />
              {selectedFile && <p className="text-xs text-slate-500 mt-1">Selected: {selectedFile.name}</p>}
            </div>
          </div>

          <div className="surface-2 rounded-xl overflow-hidden">
            <div className="bg-white/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/70">
              <span className="font-semibold text-sm text-slate-700">Items</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => templateInputRef.current?.click()} disabled={parsing} className="btn btn-sm btn-secondary text-pharma-600">
                  <i className={`fas ${parsing ? 'fa-spinner fa-spin' : 'fa-file-csv'} mr-1`}></i>{parsing ? 'Parsing...' : 'Upload Supplier CSV'}
                </button>
                <button type="button" onClick={addItem} className="btn btn-sm btn-secondary text-pharma-600"><i className="fas fa-plus mr-1"></i>Add Item</button>
              </div>
            </div>
            <input type="file" ref={templateInputRef} accept=".csv" className="hidden" onChange={handleTemplateUpload} />
            {templateMsg && (
              <div className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b border-white/70 ${templateMsg.includes('Parsed') ? 'bg-emerald-50/70 text-emerald-700' : 'bg-amber-50/70 text-amber-700'}`}>
                <i className={`fas ${templateMsg.includes('Parsed') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>{templateMsg}
              </div>
            )}
            {items.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <i className="fas fa-cart-plus text-3xl mb-3 text-slate-300"></i>
                <p className="text-sm">No items added yet. Click "Add Item" to start.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th className="text-left">Medicine</th>
                      <th className="text-left">Batch No</th>
                      <th>Expiry</th>
                      <th>MRP</th>
                      <th>Rate</th>
                      <th>Qty</th>
                      <th>Free</th>
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
                              <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{item.medicineName}</span>
                              <button type="button" onClick={() => { const u = [...items]; u[idx].medicine = ''; setItems(u); }} className="text-slate-400 hover:text-red-500" title="Change"><i className="fas fa-sync-alt text-xs"></i></button>
                            </div>
                          ) : (
                            <MedicinePicker compact onSelect={(med) => selectMedicine(idx, med)} />
                          )}
                        </td>
                        <td className="p-2"><input value={item.batchNo} onChange={e => updateItem(idx, 'batchNo', e.target.value)} className="glass-input w-24" /></td>
                        <td className="p-2"><input type="date" value={item.expiryDate} onChange={e => updateItem(idx, 'expiryDate', e.target.value)} className="glass-input w-32" /></td>
                        <td className="p-2"><input type="number" value={item.mrp} onChange={e => updateItem(idx, 'mrp', parseFloat(e.target.value) || 0)} className="glass-input w-20" /></td>
                        <td className="p-2"><input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="glass-input w-20" /></td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value) || 0)} min={0} className="glass-input w-16" /></td>
                        <td className="p-2"><input type="number" value={item.freeQty} onChange={e => updateItem(idx, 'freeQty', parseInt(e.target.value) || 0)} min={0} className="glass-input w-16" /></td>
                        <td className="p-2 text-right font-medium">₹{((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
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
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal:</span><span className="font-medium text-slate-700">₹{totals.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Discount %:</span><input type="number" value={form.discountPercent} onChange={e => updateDiscountPercent(parseFloat(e.target.value) || 0)} min={0} max={100} className="glass-input w-24 text-right" /></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Discount (₹):</span><input type="number" value={form.discountAmount} onChange={e => updateDiscountAmount(parseFloat(e.target.value) || 0)} min={0} className="glass-input w-24 text-right" /></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Freight:</span><input type="number" value={form.freight} onChange={e => setForm({ ...form, freight: parseFloat(e.target.value) || 0 })} min={0} className="glass-input w-24 text-right" /></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200 text-slate-800"><span>Total:</span><span>₹{(totals - (form.discountAmount || 0) + (form.freight || 0)).toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="glass-input" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow">
              <i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : 'Save Purchase Invoice'}
            </button>
            <button type="button" onClick={() => navigate('/purchases')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
