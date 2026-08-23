import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function SaleInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    API.get('/sale-invoices', { params }).then(res => {
      if (res.success) setInvoices(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [from, to]);

  const statusColor = {
    paid: 'green',
    partial: 'yellow',
    pending: 'red',
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', className: 'text-left', tdClass: 'font-medium' },
    { label: 'Customer', className: 'text-left', render: row => row.customerName || row.customer?.name || 'Walk-in', tdClass: '' },
    {
      label: 'Type', className: 'text-center', tdClass: 'text-center',
      render: () => <span className="badge badge-blue">Retail</span>,
    },
    {
      label: 'Date', className: 'text-left', tdClass: 'text-gray-500',
      render: row => new Date(row.invoiceDate).toLocaleDateString('en-IN'),
    },
    {
      label: 'Total', className: 'text-right', tdClass: 'font-medium text-right',
      render: row => `₹${row.totalAmount?.toFixed(2)}`,
    },
    { key: 'paymentMode', label: 'Payment Mode', className: 'text-center', tdClass: 'text-center capitalize' },
    {
      label: 'Status', className: 'text-center', tdClass: 'text-center',
      render: row => <span className={`badge badge-${statusColor[row.paymentStatus] || 'gray'}`}>{row.paymentStatus}</span>,
    },
    {
      label: 'Actions', className: 'text-center', tdClass: 'text-center',
      render: row => <Link to={`/sales/${row._id}`} className="btn-ghost text-xs">View</Link>,
    },
  ];

  return (
    <div>
      <PageHeader icon="receipt" title="Sales" subtitle="Manage sale invoices">
        <Link to="/sales/new" className="btn-primary">
          <i className="fas fa-plus"></i> New Sale
        </Link>
      </PageHeader>
      <GlassCard>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="glass-input" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="glass-input" />
        </div>
        <GlassTable columns={columns} data={invoices} loading={loading} emptyMessage="No sale invoices found" />
      </GlassCard>
    </div>
  );
}
