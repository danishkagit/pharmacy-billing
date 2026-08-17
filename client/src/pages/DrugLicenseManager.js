import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function DrugLicenseManager() {
  const [licenses, setLicenses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewalData, setRenewalData] = useState({ dlNo: '', dlExpiryDate: '', fssaiNo: '', fssaiExpiryDate: '' });

  useEffect(() => {
    API.get('/compliance/drug-license').then(res => {
      if (res.success) {
        setLicenses(res.data);
        setRenewalData({
          dlNo: res.data.dlNo || '',
          dlExpiryDate: res.data.dlExpiryDate ? res.data.dlExpiryDate.split('T')[0] : '',
          fssaiNo: res.data.fssaiNo || '',
          fssaiExpiryDate: res.data.fssaiExpiryDate ? res.data.fssaiExpiryDate.split('T')[0] : ''
        });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await API.put('/company', renewalData);
      alert('License details updated successfully');
      setLicenses({ ...licenses, ...renewalData });
    } catch (err) { alert(err?.error || 'Failed'); }
  };

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pharma-500"></div></div>;

  const dlDays = licenses?.dlExpiryDate ? getDaysLeft(licenses.dlExpiryDate) : null;
  const fssaiDays = licenses?.fssaiExpiryDate ? getDaysLeft(licenses.fssaiExpiryDate) : null;

  const dlStatus = dlDays !== null ? (dlDays <= 0 ? 'badge-red' : dlDays <= 30 ? 'badge-red' : dlDays <= 90 ? 'badge-yellow' : 'badge-green') : 'badge-gray';
  const fsStatus = fssaiDays !== null ? (fssaiDays <= 0 ? 'badge-red' : fssaiDays <= 30 ? 'badge-red' : fssaiDays <= 90 ? 'badge-yellow' : 'badge-green') : 'badge-gray';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader icon="certificate" title="Drug License Management" subtitle="Track license validity and renewals" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`glass-card surface-glass p-5 ${dlDays !== null && dlDays <= 90 ? 'ring-1 ring-red-400' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <i className="fas fa-prescription-bottle text-pharma-500"></i> Drug License (DL)
            </h3>
            <span className={`badge ${dlStatus}`}>{dlDays === null ? 'N/A' : dlDays > 0 ? `${dlDays}d` : 'Expired'}</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">License: {licenses?.dlNo || 'Not set'}</p>
          {dlDays !== null && (
            <div className={`mt-2 p-3 rounded-xl text-sm font-medium ${dlDays <= 0 ? 'bg-red-50/90 text-red-700' : dlDays <= 30 ? 'bg-red-50/70 text-red-600' : dlDays <= 90 ? 'bg-yellow-50/90 text-yellow-700' : 'bg-emerald-50/90 text-emerald-700'}`}>
              {dlDays <= 0 ? `EXPIRED! Renew immediately.` : `${dlDays} days remaining for renewal (Expires: ${new Date(licenses.dlExpiryDate).toLocaleDateString('en-IN')})`}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">Category: {licenses?.drugLicenseCategory || '-'}</p>
        </div>

        <div className={`glass-card surface-glass p-5 ${fssaiDays !== null && fssaiDays <= 90 ? 'ring-1 ring-red-400' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <i className="fas fa-certificate text-pharma-500"></i> FSSAI License
            </h3>
            <span className={`badge ${fsStatus}`}>{fsStatus === 'badge-gray' && fssaiDays === null ? 'N/A' : ''}</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">License: {licenses?.fssaiNo || 'Not set'}</p>
          {fssaiDays !== null && (
            <div className={`mt-2 p-3 rounded-xl text-sm font-medium ${fssaiDays <= 0 ? 'bg-red-50/90 text-red-700' : fssaiDays <= 30 ? 'bg-red-50/70 text-red-600' : fssaiDays <= 90 ? 'bg-yellow-50/90 text-yellow-700' : 'bg-emerald-50/90 text-emerald-700'}`}>
              {fssaiDays <= 0 ? `EXPIRED! Renew immediately.` : `${fssaiDays} days remaining for renewal (Expires: ${new Date(licenses.fssaiExpiryDate).toLocaleDateString('en-IN')})`}
            </div>
          )}
        </div>
      </div>

      <GlassCard>
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-edit text-pharma-500"></i>Update License Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Drug License No</label>
            <input value={renewalData.dlNo} onChange={e => setRenewalData({ ...renewalData, dlNo: e.target.value })} className="glass-input uppercase" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">DL Expiry Date</label>
            <input type="date" value={renewalData.dlExpiryDate} onChange={e => setRenewalData({ ...renewalData, dlExpiryDate: e.target.value })} className="glass-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">FSSAI No</label>
            <input value={renewalData.fssaiNo} onChange={e => setRenewalData({ ...renewalData, fssaiNo: e.target.value })} className="glass-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">FSSAI Expiry Date</label>
            <input type="date" value={renewalData.fssaiExpiryDate} onChange={e => setRenewalData({ ...renewalData, fssaiExpiryDate: e.target.value })} className="glass-input" />
          </div>
        </div>
        <button onClick={handleSave} className="mt-4 btn btn-primary btn-glow"><i className="fas fa-save mr-1"></i>Save License Details</button>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-clipboard-check text-pharma-500"></i>License Compliance Status</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 surface-2 rounded-xl">
            <i className={`fas ${licenses?.dlNo ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-red-500'}`}></i>
            <span className="text-sm text-slate-600">Drug License Number: {licenses?.dlNo ? licenses.dlNo : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-3 p-3 surface-2 rounded-xl">
            <i className={`fas ${dlDays !== null && dlDays > 0 ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-red-500'}`}></i>
            <span className="text-sm text-slate-600">DL Validity: {dlDays !== null ? (dlDays > 0 ? `${dlDays} days remaining` : 'EXPIRED') : 'Not set'}</span>
          </div>
          <div className="flex items-center gap-3 p-3 surface-2 rounded-xl">
            <i className={`fas ${licenses?.fssaiNo ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-red-500'}`}></i>
            <span className="text-sm text-slate-600">FSSAI Number: {licenses?.fssaiNo ? licenses.fssaiNo : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-3 p-3 surface-2 rounded-xl">
            <i className={`fas ${fssaiDays !== null && fssaiDays > 0 ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-red-500'}`}></i>
            <span className="text-sm text-slate-600">FSSAI Validity: {fssaiDays !== null ? (fssaiDays > 0 ? `${fssaiDays} days remaining` : 'EXPIRED') : 'Not set'}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
