import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassTable } from '../components/ui';

export default function CreditNoteList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  useEffect(() => {
    if (type === 'debit') {
      API.get('/purchase-returns', { params: { limit: 200 } }).then(res => {
        if (res.success) setReturns(res.data.map(r => ({ ...r, docType: 'debit' })));
      }).catch(console.error).finally(() => setLoading(false));
    } else {
      API.get('/sale-returns', { params: { limit: 200 } }).then(res => {
        if (res.success) setReturns(res.data.map(r => ({ ...r, docType: 'credit' })));
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [type]);

  const columns = [
    { label: 'Note No', render: r => <span className="font-medium">{r.docType === 'debit' ? (r.debitNoteNo || r.returnNo) : (r.creditNoteNo || r.returnNo)}</span> },
    { label: 'Type', render: r => <span className={`badge ${r.docType === 'debit' ? 'badge-red' : 'badge-green'}`}>{r.docType === 'debit' ? 'Debit Note' : 'Credit Note'}</span> },
    { label: 'Party', render: r => r.customer?.name || r.supplier?.name || '-' },
    { label: 'Return Ref', className: 'text-slate-500', render: r => r.returnNo },
    { label: 'Date', className: 'text-slate-500', render: r => new Date(r.returnDate).toLocaleDateString('en-IN') },
    { label: 'Amount', className: 'text-right', tdClass: 'text-right', render: r => <span className="font-medium">₹{r.totalAmount?.toFixed(2)}</span> },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: r => <span className={`badge ${r.status === 'completed' ? 'badge-green' : r.status === 'approved' ? 'badge-blue' : 'badge-yellow'}`}>{r.status}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Credit / Debit Notes" subtitle="Manage all return-related financial documents" />
        <div className="flex gap-2 surface-1 rounded-xl p-1.5">
          <button onClick={() => setType('')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${!type ? 'bg-white text-pharma-700 shadow glow-soft' : 'text-slate-500 hover:text-slate-700'}`}>Credit Notes</button>
          <button onClick={() => setType('debit')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${type === 'debit' ? 'bg-white text-pharma-700 shadow glow-soft' : 'text-slate-500 hover:text-slate-700'}`}>Debit Notes</button>
        </div>
      </div>
      <GlassTable columns={columns} data={returns} loading={loading} emptyMessage={`No ${type === 'debit' ? 'debit' : 'credit'} notes found`} />
    </div>
  );
}
