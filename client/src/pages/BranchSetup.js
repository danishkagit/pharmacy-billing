import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader } from '../components/ui';

export default function BranchSetup() {
  const { hasPermission } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/branches').then(res => { if (res.success) setBranches(res.data); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const addBranch = async () => {
    const name = prompt('Branch name:');
    if (!name) return;
    try {
      const res = await API.post('/branches', { name, address: prompt('Address:') || '', phone: prompt('Phone:') || '', gstin: prompt('GSTIN:') || '', dlNo: prompt('DL No:') || '' });
      if (res.success) setBranches([...branches, res.data]);
    } catch (err) { alert(err?.error || 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Branches" subtitle="Manage multi-location pharmacy outlets" />
        {hasPermission('settings') && <button onClick={addBranch} className="btn btn-primary btn-glow"><i className="fas fa-plus mr-1"></i>Add Branch</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{loading ? <div className="col-span-full flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharma-500"></div></div> : branches.map((b, i) => (
          <div key={b._id} className="glass-card p-5 stagger" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">{b.name} {b.isHeadOffice && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1">Head Office</span>}</h3>
            </div>
            <div className="text-sm text-slate-500 space-y-2">
              <p><i className="fas fa-map-marker-alt w-4 mr-1 text-pharma-500"></i>{b.address || 'No address'}</p>
              <p><i className="fas fa-phone w-4 mr-1 text-pharma-500"></i>{b.phone || '-'}</p>
              <p><i className="fas fa-id-card w-4 mr-1 text-pharma-500"></i>GST: {b.gstin || '-'}</p>
              <p><i className="fas fa-prescription-bottle w-4 mr-1 text-pharma-500"></i>DL: {b.dlNo || '-'}</p>
              <p><i className="fas fa-file-invoice w-4 mr-1 text-pharma-500"></i>Prefix: {b.invoicePrefix} | Next: {b.invoiceCounter || 0}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
