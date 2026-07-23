import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Branches</h1>
        {hasPermission('settings') && <button onClick={addBranch} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><i className="fas fa-plus mr-2"></i>Add Branch</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : branches.map(b => (
          <div key={b._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{b.name} {b.isHeadOffice && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Head Office</span>}</h3>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p><i className="fas fa-map-marker-alt w-4 mr-1"></i>{b.address || 'No address'}</p>
              <p><i className="fas fa-phone w-4 mr-1"></i>{b.phone || '-'}</p>
              <p><i className="fas fa-id-card w-4 mr-1"></i>GST: {b.gstin || '-'}</p>
              <p><i className="fas fa-prescription-bottle w-4 mr-1"></i>DL: {b.dlNo || '-'}</p>
              <p><i className="fas fa-file-invoice w-4 mr-1"></i>Prefix: {b.invoicePrefix} | Next: {b.invoiceCounter || 0}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
