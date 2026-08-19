import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function Settings() {
  const { user, logout } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [slabs, setSlabs] = useState([{ minMRP: 0, discountPercent: 10 }, { minMRP: 100, discountPercent: 15 }]);
  const [slabMsg, setSlabMsg] = useState('');
  const [slabLoading, setSlabLoading] = useState(false);

  useEffect(() => {
    API.get('/company').then(res => {
      if (res.success && res.data?.discountSlabs?.length) setSlabs(res.data.discountSlabs);
    }).catch(() => {});
  }, []);

  const updateSlab = (idx, field, value) => {
    const updated = slabs.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setSlabs(updated);
  };

  const addSlab = () => setSlabs([...slabs, { minMRP: 0, discountPercent: 0 }]);

  const removeSlab = (idx) => setSlabs(slabs.filter((_, i) => i !== idx));

  const saveSlabs = async (e) => {
    e.preventDefault();
    const sorted = [...slabs].map(s => ({ minMRP: Number(s.minMRP) || 0, discountPercent: Number(s.discountPercent) || 0 })).sort((a, b) => a.minMRP - b.minMRP);
    setSlabLoading(true);
    try {
      const res = await API.put('/company', { discountSlabs: sorted });
      if (res.success) { setSlabs(res.data.discountSlabs); setSlabMsg('Discount slabs saved'); }
    } catch (err) { setSlabMsg(err?.error || 'Failed to save'); }
    finally { setSlabLoading(false); }
  };

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
      <PageHeader icon="cog" title="Settings" subtitle="Manage your account and password" />

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

      <GlassCard>
        <h2 className="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2"><i className="fas fa-percent text-pharma-500"></i>Customer Discount Slabs</h2>
        <p className="text-xs text-slate-500 mb-4">Retail customers get an automatic discount based on the total MRP of the bill. The slab with the highest minimum MRP that is still ≤ total MRP applies. Leave disabled (0%) or set a single 0-MRP slab to turn it off.</p>
        {slabMsg && <div className={`animate-fade-up px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border ${slabMsg.includes('saved') ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' : 'bg-red-50/90 text-red-600 border-red-200'}`}><i className="fas fa-circle-info"></i>{slabMsg}</div>}
        <form onSubmit={saveSlabs} className="space-y-4">
          <div className="space-y-2">
            {slabs.map((s, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Total MRP ≥</label>
                  <input type="number" value={s.minMRP} min={0} onChange={e => updateSlab(idx, 'minMRP', parseFloat(e.target.value) || 0)} className="glass-input w-32" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Discount %</label>
                  <input type="number" value={s.discountPercent} min={0} max={100} onChange={e => updateSlab(idx, 'discountPercent', parseFloat(e.target.value) || 0)} className="glass-input w-24" />
                </div>
                <button type="button" onClick={() => removeSlab(idx)} className="btn btn-ghost btn-sm text-red-400 hover:text-red-600 mb-0.5" title="Remove slab"><i className="fas fa-trash"></i></button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={addSlab} className="btn btn-sm btn-secondary text-pharma-600"><i className="fas fa-plus mr-1"></i>Add Slab</button>
            <button type="submit" disabled={slabLoading} className="btn btn-primary btn-glow"><i className="fas fa-save mr-1"></i>{slabLoading ? 'Saving...' : 'Save Slabs'}</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
