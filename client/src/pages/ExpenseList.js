import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    API.get('/expenses', { params: { from, to } }).then(res => {
      if (res.success) setExpenses(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [from, to]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
        <Link to="/expenses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><i className="fas fa-plus mr-2"></i>Add Expense</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Vendor</th>
                  <th className="text-left p-3 font-medium">Mode</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(e.expenseDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-medium">{e.category}</td>
                    <td className="p-3 text-gray-500">{e.description || '-'}</td>
                    <td className="p-3 text-gray-500">{e.vendor || '-'}</td>
                    <td className="p-3 capitalize">{e.paymentMode}</td>
                    <td className="p-3 text-right font-medium">₹{e.totalAmount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
