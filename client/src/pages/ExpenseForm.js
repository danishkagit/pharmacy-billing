import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function ExpenseForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: 'Rent', subCategory: '', amount: 0, gstAmount: 0, expenseDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', vendor: '', billNo: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/expenses', { ...form, totalAmount: (form.amount || 0) + (form.gstAmount || 0) });
      if (res.success) navigate('/expenses');
    } catch (err) { alert(err?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <PageHeader title="Add Expense" subtitle="Record an operational expense" />
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="glass-select">
                {['Rent','Electricity','Staff Salary','Water','Maintenance','Transport','Marketing','Office Supplies','Legal','Insurance','Tax','Cleaning','Security','Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Date</label><input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required min={0} step="0.01" className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GST Amount</label><input type="number" value={form.gstAmount} onChange={e => setForm({ ...form, gstAmount: parseFloat(e.target.value) || 0 })} min={0} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })} className="glass-select">
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Vendor</label><input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Bill No</label><input value={form.billNo} onChange={e => setForm({ ...form, billNo: e.target.value })} className="glass-input" /></div>
          </div>
          <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="glass-input" /></div>
          <div className="text-right text-lg font-bold text-emerald-600">Total: ₹{((form.amount || 0) + (form.gstAmount || 0)).toFixed(2)}</div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-check mr-1"></i>{loading ? 'Saving...' : 'Save Expense'}</button>
            <button type="button" onClick={() => navigate('/expenses')} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
