import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';
import API from '../utils/api';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/customers', { params: { search: search || undefined, limit: 200 } }).then(res => {
      if (res.success) setCustomers(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: c => <span className="font-medium">{c.name}</span>,
      tdClass: 'p-3'
    },
    {
      key: 'phone',
      label: 'Phone',
      render: c => <span className="text-gray-400">{c.phone || '-'}</span>,
      tdClass: 'p-3'
    },
    {
      key: 'type',
      label: 'Type',
      className: 'text-center',
      tdClass: 'p-3 text-center',
      render: c => <span className="badge badge-blue">Retail</span>
    },
    {
      key: 'creditLimit',
      label: 'Credit Limit',
      className: 'text-right',
      tdClass: 'p-3 text-right',
      render: c => `\u20B9${c.creditLimit?.toFixed(0)}`
    },
    {
      key: 'loyaltyPoints',
      label: 'Loyalty Points',
      className: 'text-right',
      tdClass: 'p-3 text-right',
      render: c => c.loyaltyPoints || 0
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-center',
      tdClass: 'p-3 text-center',
      render: c => (
        <>
          <Link to={`/customers/${c._id}/edit`} className="btn-ghost text-xs mr-2">Edit</Link>
          <button onClick={() => API.delete(`/customers/${c._id}`).then(() => setCustomers(prev => prev.filter(x => x._id !== c._id)))} className="btn-ghost text-xs text-red-400 hover:text-red-300">Deactivate</button>
        </>
      )
    }
  ];

  return (
    <div>
      <PageHeader icon="users" title="Customers" subtitle="Manage your customers and patients">
        <Link to="/customers/new" className="btn-primary">
          <i className="fas fa-plus"></i> Add Customer
        </Link>
      </PageHeader>
      <GlassCard className="mb-6">
        <div className="flex gap-4 mb-4">
          <input placeholder="Search by name or phone — retail customers..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input flex-1" />
        </div>
        <div className="overflow-x-auto">
          <GlassTable columns={columns} data={customers} loading={loading} emptyMessage="No customers found" />
        </div>
      </GlassCard>
    </div>
  );
}
