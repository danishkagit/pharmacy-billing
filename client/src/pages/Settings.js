import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENTS } from '../context/ThemeContext';
import { useWorkspace, MODE_META } from '../context/WorkspaceContext';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTabs } from '../components/ui';
import { GST_SLABS, GST_EFFECTIVE_DATE } from '../utils/gst';

const INVOICE_TEMPLATES = [
  { value: 'a4', label: 'A4 Tax Invoice' },
  { value: 'a5', label: 'A5 Invoice' },
  { value: 'thermal80', label: 'Thermal 80mm' },
  { value: 'thermal58', label: 'Thermal 58mm' }
];

function useCompanyCategory() {
  const { company } = useAuth();
  const [category, setCategory] = useState(company?.drugLicenseCategory || null);
  useEffect(() => {
    API.get('/company').then(res => {
      if (res.success) setCategory(res.data.drugLicenseCategory || 'both');
    }).catch(() => {});
  }, []);
  return category || company?.drugLicenseCategory || 'both';
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { mode, setMode, availableModes } = useWorkspace();
  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const [tab, setTab] = useState('invoice');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [slabs, setSlabs] = useState([{ minMRP: 0, discountPercent: 10 }, { minMRP: 100, discountPercent: 15 }]);
  const [slabMsg, setSlabMsg] = useState('');
  const [slabLoading, setSlabLoading] = useState(false);
  // Company-wide settings
  const [inv, setInv] = useState({});
  const [gstCfg, setGstCfg] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [savingInv, setSavingInv] = useState(false);
  const [savingGst, setSavingGst] = useState(false);
  const [ratesInfo, setRatesInfo] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState('');
  const companyCategory = useCompanyCategory();

  useEffect(() => {
    API.get('/company').then(res => {
      if (res.success) {
        const d = res.data;
        if (d.discountSlabs?.length) setSlabs(d.discountSlabs);
        setInv({
          invoiceTemplate: d.invoiceTemplate || 'a4',
          showHsnOnPrint: d.showHsnOnPrint !== false,
          showExpiryOnPrint: d.showExpiryOnPrint !== false,
          showMrpOnPrint: d.showMrpOnPrint !== false,
          billCopies: d.billCopies || 1,
          printAfterSave: !!d.printAfterSave,
          declarationNote: d.declarationNote || 'Goods once sold will not be taken back or exchanged.',
          scheduleWarningNote: d.scheduleWarningNote || 'Schedule H/H1 drugs to be sold only against the prescription of a Registered Medical Practitioner.',
          invoicePrefix: d.invoicePrefix || 'PH',
          invoiceNote: d.invoiceNote || 'Thank you for your business!'
        });
        setGstCfg({
          gstType: d.gstType || 'regular',
          taxMode: d.taxMode || 'mrp_inclusive',
          autoRoundOff: d.autoRoundOff !== false,
          enableEInvoice: !!d.enableEInvoice,
          ewayThreshold: d.ewayThreshold || 50000
        });
      }
    }).catch(() => {});
    API.get('/gst/rates-info').then(r => { if (r.success) setRatesInfo(r.data); }).catch(() => {});
  }, []);

  const saveCompany = async (patch, setSaving, onDone) => {
    setSaving(true);
    try {
      const res = await API.put('/company', patch);
      if (res.success) { onDone && onDone(res.data); return true; }
    } catch (err) { return false; }
    finally { setSaving(false); }
    return false;
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

  const updateSlab = (idx, field, value) => {
    setSlabs(slabs.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const saveSlabs = async (e) => {
    e.preventDefault();
    const sorted = [...slabs].map(s => ({ minMRP: Number(s.minMRP) || 0, discountPercent: Number(s.discountPercent) || 0 })).sort((a, b) => a.minMRP - b.minMRP);
    setSlabLoading(true);
    try {
      const res = await API.put('/company', { discountSlabs: sorted });
      if (res.success) { setSlabs(res.data.discountSlabs || sorted); setSlabMsg('Discount slabs saved'); }
      else setSlabMsg(res.error || 'Failed to save');
    } catch (err) { setSlabMsg(err?.error || 'Failed to save'); }
    finally { setSlabLoading(false); }
  };

  const runMigration = async () => {
    if (!window.confirm('Re-rate all medicines to post-22-Sep-2025 GST slabs? Medicines at 12%/28% move to their HSN/category rate (5%).')) return;
    setMigrating(true);
    setMigrateMsg('');
    try {
      const res = await API.post('/gst/update-medicine-rates');
      if (res.success) setMigrateMsg(res.message || `Updated ${res.data.updated} medicines`);
      else setMigrateMsg(res.error || 'Migration failed');
    } catch (err) { setMigrateMsg(err?.error || 'Migration failed'); }
    finally { setMigrating(false); }
  };

  const tabs = [
    { key: 'workspace', label: 'Workspace', icon: 'sliders' },
    { key: 'invoice', label: 'Invoice & Printing', icon: 'file-invoice' },
    { key: 'gst', label: 'GST & Compliance', icon: 'percent' },
    { key: 'discounts', label: 'Discounts', icon: 'badge-percent' },
    { key: 'account', label: 'Account & Security', icon: 'user-shield' }
  ];

  const Toggle = ({ checked, onChange, label, hint }) => (
    <label className="flex items-start gap-3 cursor-pointer py-1.5">
      <button type="button" onClick={() => onChange(!checked)}
        className={`mt-0.5 relative h-5 w-9 rounded-full transition-colors shrink-0 ${checked ? 'bg-pharma-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}></span>
      </button>
      <span>
        <span className="text-sm text-slate-700 font-medium block">{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </span>
    </label>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader icon="cog" title="Settings" subtitle="Configure invoicing, GST engine, discounts and your account" />

      <GlassTabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ══════════ WORKSPACE & APPEARANCE ══════════ */}
      {tab === 'workspace' && (
        <>
          <GlassCard>
            <h2 className="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2"><i className="fas fa-store text-pharma-500"></i>Workspace Desk</h2>
            <p className="text-xs text-slate-500 mb-4">
              Retail-only build — your pharmacy is configured for <b>Retail Counter</b> billing (walk-in POS, prescriptions &amp; loyalty).
            </p>
            {availableModes.length > 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableModes.map(m => {
                  const active = mode === m;
                  return (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`text-left p-4 rounded-xl border transition-all ${active ? 'border-pharma-400 bg-pharma-50/70 dark:bg-pharma-900/20 ring-1 ring-pharma-300' : 'border-slate-200 bg-white/60 dark:bg-slate-800/60 hover:border-pharma-300'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{MODE_META[m].label}</span>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-pharma-500' : 'border-slate-300'}`}>
                          {active && <span className="w-2 h-2 rounded-full bg-pharma-500"></span>}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{MODE_META[m].tagline}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <i className={`fas fa-${MODE_META[mode].icon} text-emerald-500`}></i>
                {MODE_META[mode].label} — single-desk license
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-3"><i className="fas fa-circle-info mr-1"></i>Desk preference is stored per device. Change license category in Company Setup.</p>
          </GlassCard>

          <GlassCard>
            <h2 className="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2"><i className="fas fa-palette text-pharma-500"></i>Appearance</h2>
            <p className="text-xs text-slate-500 mb-4">Pick a theme mode and accent colour. The accent re-tints buttons, focus rings, navigation and badges across the whole app.</p>

            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Theme Mode</label>
            <div className="grid grid-cols-2 max-w-xs mb-5 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {[{ id: 'light', label: 'Light', icon: 'sun' }, { id: 'dark', label: 'Dark', icon: 'moon' }].map(t => (
                <button key={t.id} type="button" onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${theme === t.id ? 'bg-white dark:bg-slate-900 shadow-sm text-pharma-600' : 'text-slate-500'}`}>
                  <i className={`fas fa-${t.icon}`}></i>{t.label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Accent Colour</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ACCENTS.map(a => (
                <button key={a.id} type="button" onClick={() => setAccent(a.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${accent === a.id ? 'border-pharma-400 bg-pharma-50/70 dark:bg-pharma-900/20 ring-1 ring-pharma-300' : 'border-slate-200 bg-white/60 dark:bg-slate-800/60 hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg shadow-inner-glass" style={{ backgroundColor: a.swatch }}></span>
                    {accent === a.id && <i className="fas fa-circle-check text-pharma-500"></i>}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.label}</p>
                  <p className="text-[10px] font-mono text-slate-400">{a.swatch}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3"><i className="fas fa-circle-info mr-1"></i>Appearance is saved on this device and respects your system light/dark preference by default.</p>
          </GlassCard>
        </>
      )}

      {/* ══════════ INVOICE & PRINTING ══════════ */}
      {tab === 'invoice' && (
        <GlassCard>
          <h2 className="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2"><i className="fas fa-file-invoice text-pharma-500"></i>Invoice & Printing</h2>
          <p className="text-xs text-slate-500 mb-4">Controls the default bill format on the invoice page and what appears on printed invoices.</p>
          {saveMsg && <div className={`px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border ${saveMsg.includes('saved') ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' : 'bg-red-50/90 text-red-600 border-red-200'}`}><i className="fas fa-circle-info"></i>{saveMsg}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Default Template</label>
              <select value={inv.invoiceTemplate} onChange={e => setInv({ ...inv, invoiceTemplate: e.target.value })} className="glass-select">
                {INVOICE_TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Bill Copies</label>
              <select value={inv.billCopies} onChange={e => setInv({ ...inv, billCopies: parseInt(e.target.value) })} className="glass-select">
                <option value={1}>1 — Original</option>
                <option value={2}>2 — Original + Duplicate</option>
                <option value={3}>3 — Original + Duplicate + Triplicate</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">B2B invoices are typically printed in triplicate.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Invoice Series Prefix</label>
              <input value={inv.invoicePrefix} disabled className="glass-input uppercase font-mono bg-slate-50" />
              <p className="text-[10px] text-slate-400 mt-1">Per branch — edit in Branches setup.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-4">
            <Toggle checked={inv.printAfterSave} onChange={v => setInv({ ...inv, printAfterSave: v })} label="Open print dialog after saving a bill"
              hint="POS-style auto print on every new sale" />
            <Toggle checked={inv.showHsnOnPrint} onChange={v => setInv({ ...inv, showHsnOnPrint: v })} label="Show HSN column"
              hint="Rule 46 requirement — keep on unless thermal" />
            <Toggle checked={inv.showExpiryOnPrint} onChange={v => setInv({ ...inv, showExpiryOnPrint: v })} label="Show batch expiry on invoice"
              hint="D&C Rules r.65(5) pharma requirement" />
            <Toggle checked={inv.showMrpOnPrint} onChange={v => setInv({ ...inv, showMrpOnPrint: v })} label="Show MRP column" hint="Hide for compact A5 bills" />
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Declaration Note</label>
              <input value={inv.declarationNote} onChange={e => setInv({ ...inv, declarationNote: e.target.value })} className="glass-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Schedule H/H1 Warning Note</label>
              <input value={inv.scheduleWarningNote} onChange={e => setInv({ ...inv, scheduleWarningNote: e.target.value })} className="glass-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Footer / Thank-you Note</label>
              <input value={inv.invoiceNote} onChange={e => setInv({ ...inv, invoiceNote: e.target.value })} className="glass-input text-sm" />
            </div>
          </div>

          <div className="pt-4">
            <button disabled={!isOwner || savingInv}
              onClick={async () => { setSaveMsg(''); const ok = await saveCompany(inv, setSavingInv, () => {}); setSaveMsg(ok ? 'Invoice settings saved' : 'Failed to save (owner/admin only)'); }}
              className="btn btn-primary btn-glow">
              <i className="fas fa-save mr-1"></i>{savingInv ? 'Saving...' : 'Save Invoice Settings'}
            </button>
            {!isOwner && <span className="text-xs text-amber-600 ml-3"><i className="fas fa-lock mr-1"></i>Owner/admin access required</span>}
          </div>
        </GlassCard>
      )}

      {/* ══════════ GST & COMPLIANCE ══════════ */}
      {tab === 'gst' && (
        <GlassCard>
          <h2 className="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2"><i className="fas fa-percent text-pharma-500"></i>GST & Compliance</h2>
          <p className="text-xs text-slate-500 mb-4">GST 2.0 engine settings effective {new Date(GST_EFFECTIVE_DATE).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} (56th GST Council).</p>
          {saveMsg && <div className={`px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border ${saveMsg.includes('saved') ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' : 'bg-red-50/90 text-red-600 border-red-200'}`}><i className="fas fa-circle-info"></i>{saveMsg}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">GST Registration Type</label>
              <select value={gstCfg.gstType} onChange={e => setGstCfg({ ...gstCfg, gstType: e.target.value })} className="glass-select">
                <option value="regular">Regular — Tax Invoice with CGST/SGST/IGST</option>
                <option value="composition">Composition — Bill of Supply (1% retailers)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Tax Calculation Mode</label>
              <select value={gstCfg.taxMode} onChange={e => setGstCfg({ ...gstCfg, taxMode: e.target.value })} className="glass-select">
                <option value="mrp_inclusive">MRP-inclusive (recommended for pharma)</option>
                <option value="exclusive">Exclusive — add GST on top of rate</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Pharma MRPs are all-inclusive under Legal Metrology rules.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">E-way Bill Threshold (₹)</label>
              <input type="number" min={0} value={gstCfg.ewayThreshold} onChange={e => setGstCfg({ ...gstCfg,ewayThreshold: parseFloat(e.target.value) || 0 })} className="glass-input" />
              <p className="text-[10px] text-slate-400 mt-1">Statutory default ₹50,000 consignment value.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-4">
            <Toggle checked={gstCfg.autoRoundOff} onChange={v => setGstCfg({ ...gstCfg, autoRoundOff: v })} label="Auto round-off bill total to nearest rupee" />
            <Toggle checked={gstCfg.enableEInvoice} onChange={v => setGstCfg({ ...gstCfg, enableEInvoice: v })} label="e-Invoicing enabled (IRN on B2B)"
              hint="Mandatory above ₹5 Cr aggregate turnover" />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button disabled={!isOwner || savingGst}
              onClick={async () => { setSaveMsg(''); const ok = await saveCompany(gstCfg, setSavingGst, () => {}); setSaveMsg(ok ? 'GST settings saved' : 'Failed to save (owner/admin only)'); }}
              className="btn btn-primary btn-glow">
              <i className="fas fa-save mr-1"></i>{savingGst ? 'Saving...' : 'Save GST Settings'}
            </button>
            {!isOwner && <span className="text-xs text-amber-600"><i className="fas fa-lock mr-1"></i>Owner/admin access required</span>}
          </div>

          {/* GST 2.0 slab reference */}
          {ratesInfo && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-2"><i className="fas fa-layer-group mr-1.5 text-pharma-500"></i>Active Slab Structure (Nil / 5% / 18% / 40%)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[0, 5, 18, 40].map(s => (
                  <div key={s} className={`rounded-xl p-3 text-center border ${[12, 28].includes(s) ? 'opacity-40 line-through' : ''} ${s === 5 ? 'border-pharma-300 bg-pharma-50/60' : 'border-slate-200 bg-white/60'}`}>
                    <p className="text-xl font-bold text-slate-800">{s}%</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {s === 0 ? 'Life-saving drugs, sanitary napkins' : s === 5 ? 'All medicines & devices' : s === 18 ? 'Residual goods' : 'Demerit: soft drinks, pan masala'}
                    </p>
                  </div>
                ))}
              </div>
              <ul className="text-xs text-slate-500 space-y-1">
                <li><i className="fas fa-check text-emerald-500 mr-1.5"></i>All medicaments (HSN 3001–3006), vaccines, devices, supplements: <b>5%</b> w.e.f. 22-Sep-2025</li>
                <li><i className="fas fa-check text-emerald-500 mr-1.5"></i>36 notified life-saving drugs (cancer/rare diseases): <b>Nil</b> — ITC reversal applies</li>
                <li><i className="fas fa-triangle-exclamation text-amber-500 mr-1.5"></i>Aerated sugary drinks <b>40%</b>; pan masala/gutkha <b>40%</b> from 01-Feb-2026</li>
                <li><i className="fas fa-file-lines text-sky-500 mr-1.5"></i>e-Invoice threshold ₹5 Cr · B2CL inter-state limit ₹1L · GSTR-3B locked to GSTR-1</li>
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={runMigration} disabled={!isOwner || migrating} className="btn btn-secondary text-pharma-700 border-pharma-300">
                  <i className={`fas ${migrating ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'} mr-1`}></i>
                  {migrating ? 'Migrating…' : 'Migrate Medicine Rates to GST 2.0'}
                </button>
                {migrateMsg && <span className="text-xs text-slate-500"><i className="fas fa-circle-info mr-1"></i>{migrateMsg}</span>}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* ══════════ DISCOUNTS ══════════ */}
      {tab === 'discounts' && (
        <GlassCard>
          <h2 className="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2"><i className="fas fa-badge-percent text-pharma-500"></i>Customer Discount Slabs</h2>
          <p className="text-xs text-slate-500 mb-4">Retail customers get an automatic discount based on the total MRP of the bill. The slab with the highest minimum MRP that is still ≤ total MRP applies. Set a single 0-MRP slab at 0% to turn it off.</p>
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
                  <button type="button" onClick={() => setSlabs(slabs.filter((_, i) => i !== idx))} className="btn btn-ghost btn-sm text-red-400 hover:text-red-600 mb-0.5" title="Remove slab"><i className="fas fa-trash"></i></button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSlabs([...slabs, { minMRP: 0, discountPercent: 0 }])} className="btn btn-sm btn-secondary text-pharma-600"><i className="fas fa-plus mr-1"></i>Add Slab</button>
              <button type="submit" disabled={slabLoading} className="btn btn-primary btn-glow"><i className="fas fa-save mr-1"></i>{slabLoading ? 'Saving...' : 'Save Slabs'}</button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* ══════════ ACCOUNT & SECURITY ══════════ */}
      {tab === 'account' && (
        <>
          <GlassCard>
            <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-user-circle text-pharma-500"></i>Account</h2>
            <div className="text-sm text-slate-600 space-y-2">
              <p><span className="font-medium text-slate-700">Name:</span> {user?.name}</p>
              <p><span className="font-medium text-slate-700">Email:</span> {user?.email}</p>
              <p><span className="font-medium text-slate-700">Role:</span> <span className="text-xs bg-pharma-100 text-pharma-700 px-2 py-0.5 rounded-full capitalize">{user?.role}</span></p>
            </div>
            <button onClick={logout} className="btn btn-secondary mt-4"><i className="fas fa-right-from-bracket mr-1"></i>Sign Out</button>
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
        </>
      )}
    </div>
  );
}
