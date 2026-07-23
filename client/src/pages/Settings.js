import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setMsg('Passwords do not match');
    if (passwords.newPassword.length < 6) return setMsg('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await API.post('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      if (res.success) { setMsg('Password changed successfully'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    } catch (err) { setMsg(err?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p><span className="font-medium">Name:</span> {user?.name}</p>
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Role:</span> <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        {msg && <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label><input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
