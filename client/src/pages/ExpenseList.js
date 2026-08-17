import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassTable } from '../components/ui';

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

  const columns = [
    { label: 'Date', render: e => new Date(e.expenseDate).toLocaleDateString('en-IN') },
    { label: 'Category', render: e => <span className="font-medium">{e.category}</span> },
    { label: 'Description', className: 'text-slate-500', render: e => e.description || '-' },
    { label: 'Vendor', className: 'text-slate-500', render: e => e.vendor || '-' },
    { label: 'Mode', render: e => <span className="capitalize">{e.paymentMode}</span> },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right', render: e => <span className="font-medium">₹{e.totalAmount?.toFixed(2)}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader icon="wallet" title="Expenses" subtitle="Track operational outgoings" />
        <Link to="/expenses/new" className="btn btn-primary btn-glow"><i className="fas fa-plus mr-1"></i>Add Expense</Link>
      </div>
      <div className="surface-1 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-slate-600">Filter by date:</span>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="glass-input w-auto" />
        <span className="text-slate-400">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="glass-input w-auto" />
      </div>
      <GlassTable columns={columns} data={expenses} loading={loading} emptyMessage="No expenses recorded" />
    </div>
  );
}
