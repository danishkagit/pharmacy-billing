import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/suppliers', { params: { search, limit: 200 } }).then(res => {
      if (res.success) setSuppliers(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  const columns = [
    { key: 'name', label: 'Name', tdClass: 'font-medium' },
    { key: 'company', label: 'Company', render: s => s.company || '-' },
    { key: 'phone', label: 'Phone', render: s => s.phone || '-' },
    { key: 'gstin', label: 'GSTIN', render: s => s.gstin || '-' },
    { key: 'dlNo', label: 'DL (Retail)', render: s => s.dlNo || '-' },
    { key: 'dlNoWholesale', label: 'DL (Wholesale)', render: s => s.dlNoWholesale || '-' },
    { key: 'creditDays', label: 'Credit Days', className: 'text-right', tdClass: 'text-right' },
    { key: 'defaultDiscountPercent', label: 'Disc %', className: 'text-center', tdClass: 'text-center', render: s => s.defaultDiscountPercent ? `${s.defaultDiscountPercent}%` : '-' },
    {
      label: 'Actions', className: 'text-center', tdClass: 'text-center',
      render: s => (
        <>
          <Link to={`/suppliers/${s._id}/edit`} className="btn btn-ghost btn-sm text-pharma-600">Edit</Link>
          <button onClick={() => { if (window.confirm('Deactivate?')) API.delete(`/suppliers/${s._id}`).then(() => setSuppliers(prev => prev.filter(x => x._id !== s._id))); }} className="btn btn-ghost btn-sm text-red-400 hover:text-red-500">Deactivate</button>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="truck" title="Suppliers" subtitle="Manage your vendors and purchase contacts">
        <Link to="/suppliers/new" className="btn btn-primary">
          <i className="fas fa-plus"></i> Add Supplier
        </Link>
      </PageHeader>
      <GlassCard>
        <div className="flex flex-wrap gap-3 mb-4">
          <input placeholder="Search by name, company or phone..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input flex-1 min-w-[220px]" />
        </div>
        <div className="overflow-x-auto">
          <GlassTable
            columns={columns}
            data={suppliers}
            loading={loading}
            emptyMessage="No suppliers found"
          />
        </div>
      </GlassCard>
    </div>
  );
}
