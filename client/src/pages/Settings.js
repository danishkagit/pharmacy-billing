import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

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
    <div className="max-w-xl mx-auto space-y-5">
      <PageHeader title="Settings" subtitle="Manage your account and password" />

      <GlassCard>
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-user-circle text-pharma-500"></i>Account</h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p><span className="font-medium text-slate-700">Name:</span> {user?.name}</p>
          <p><span className="font-medium text-slate-700">Email:</span> {user?.email}</p>
          <p><span className="font-medium text-slate-700">Role:</span> <span className="text-xs bg-pharma-100 text-pharma-700 px-2 py-0.5 rounded-full capitalize">{user?.role}</span></p>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-key text-pharma-500"></i>Change Password</h2>
        {msg && <div className={`animate-fade-up px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border ${msg.includes('success') ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' : 'bg-red-50/90 text-red-600 border-red-200'}`}><i className="fas fa-circle-info"></i>{msg}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Current Password</label><input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required className="glass-input" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">New Password</label><input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required className="glass-input" /></div>
            <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password</label><input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} required className="glass-input" /></div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-glow"><i className="fas fa-lock mr-1"></i>{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </GlassCard>
    </div>
  );
}
