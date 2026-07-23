import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

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
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Expense</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                {['Rent','Electricity','Staff Salary','Water','Maintenance','Transport','Marketing','Office Supplies','Legal','Insurance','Tax','Cleaning','Security','Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required min={0} step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">GST Amount</label><input type="number" value={form.gstAmount} onChange={e => setForm({ ...form, gstAmount: parseFloat(e.target.value) || 0 })} min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label><input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bill No</label><input value={form.billNo} onChange={e => setForm({ ...form, billNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          <div className="text-right text-lg font-bold">Total: ₹{((form.amount || 0) + (form.gstAmount || 0)).toFixed(2)}</div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Expense'}</button>
            <button type="button" onClick={() => navigate('/expenses')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
