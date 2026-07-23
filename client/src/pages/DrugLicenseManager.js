import { useState, useEffect } from 'react';
import API from '../utils/api';

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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  const dlDays = licenses?.dlExpiryDate ? getDaysLeft(licenses.dlExpiryDate) : null;
  const fssaiDays = licenses?.fssaiExpiryDate ? getDaysLeft(licenses.fssaiExpiryDate) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Drug License Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`bg-white rounded-xl shadow-sm p-5 ${dlDays !== null && dlDays <= 90 ? 'ring-2 ring-red-400' : ''}`}>
          <h3 className="font-semibold flex items-center gap-2">
            <i className="fas fa-prescription-bottle text-blue-600"></i> Drug License (DL)
          </h3>
          <p className="text-sm text-gray-500 mt-2">License: {licenses?.dlNo || 'Not set'}</p>
          {dlDays !== null && (
            <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${dlDays <= 0 ? 'bg-red-100 text-red-700' : dlDays <= 30 ? 'bg-red-50 text-red-600' : dlDays <= 90 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
              {dlDays <= 0 ? `EXPIRED! Renew immediately.` : `${dlDays} days remaining for renewal (Expires: ${new Date(licenses.dlExpiryDate).toLocaleDateString('en-IN')})`}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Category: {licenses?.drugLicenseCategory || '-'}</p>
        </div>

        <div className={`bg-white rounded-xl shadow-sm p-5 ${fssaiDays !== null && fssaiDays <= 90 ? 'ring-2 ring-red-400' : ''}`}>
          <h3 className="font-semibold flex items-center gap-2">
            <i className="fas fa-certificate text-green-600"></i> FSSAI License
          </h3>
          <p className="text-sm text-gray-500 mt-2">License: {licenses?.fssaiNo || 'Not set'}</p>
          {fssaiDays !== null && (
            <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${fssaiDays <= 0 ? 'bg-red-100 text-red-700' : fssaiDays <= 30 ? 'bg-red-50 text-red-600' : fssaiDays <= 90 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
              {fssaiDays <= 0 ? `EXPIRED! Renew immediately.` : `${fssaiDays} days remaining for renewal (Expires: ${new Date(licenses.fssaiExpiryDate).toLocaleDateString('en-IN')})`}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Update License Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drug License No</label>
            <input value={renewalData.dlNo} onChange={e => setRenewalData({ ...renewalData, dlNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DL Expiry Date</label>
            <input type="date" value={renewalData.dlExpiryDate} onChange={e => setRenewalData({ ...renewalData, dlExpiryDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI No</label>
            <input value={renewalData.fssaiNo} onChange={e => setRenewalData({ ...renewalData, fssaiNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI Expiry Date</label>
            <input type="date" value={renewalData.fssaiExpiryDate} onChange={e => setRenewalData({ ...renewalData, fssaiExpiryDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
          </div>
        </div>
        <button onClick={handleSave} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Save License Details</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">License Compliance Status</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <i className={`fas ${licenses?.dlNo ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
            <span className="text-sm">Drug License Number: {licenses?.dlNo ? licenses.dlNo : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <i className={`fas ${dlDays !== null && dlDays > 0 ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
            <span className="text-sm">DL Validity: {dlDays !== null ? (dlDays > 0 ? `${dlDays} days remaining` : 'EXPIRED') : 'Not set'}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <i className={`fas ${licenses?.fssaiNo ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
            <span className="text-sm">FSSAI Number: {licenses?.fssaiNo ? licenses.fssaiNo : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <i className={`fas ${fssaiDays !== null && fssaiDays > 0 ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
            <span className="text-sm">FSSAI Validity: {fssaiDays !== null ? (fssaiDays > 0 ? `${fssaiDays} days remaining` : 'EXPIRED') : 'Not set'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
