import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AiAssistant from './AiAssistant';
import Logo from './Logo';

/* ────────────────────────────────────────────────────────────────
   Navigation map — money-makers first, compliance & tools after.
   shortcut: global function key (guarded when typing in inputs)
   ──────────────────────────────────────────────────────────────── */
const navSections = [
  {
    label: 'Counter',
    items: [
      { label: 'New Sale', path: '/sales/new', icon: 'cash-register', hot: true },
      { label: 'Sales History', path: '/sales', icon: 'receipt' },
      { label: 'Sale Returns', path: '/sale-returns', icon: 'rotate-left' },
      { label: 'Customers', path: '/customers', icon: 'users' },
    ],
  },
  {
    label: 'Stock In',
    items: [
      { label: 'New Purchase', path: '/purchases/new', icon: 'cart-plus', hot: true },
      { label: 'Purchase History', path: '/purchases', icon: 'file-invoice' },
      { label: 'Add Stock Manually', path: '/stock-adjustments/new', icon: 'boxes-stacked', hot: true },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: 'clipboard-list' },
      { label: 'Purchase Returns', path: '/purchase-returns', icon: 'undo' },
      { label: 'Suppliers', path: '/suppliers', icon: 'truck' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Medicines', path: '/medicines', icon: 'pills' },
      { label: 'Batches & Stock', path: '/batches', icon: 'boxes' },
      { label: 'Expiry Tracker', path: '/expiry', icon: 'clock-rotate-left' },
      { label: 'Import Data', path: '/medicines/import', icon: 'file-import' },
      { label: 'Transfers', path: '/transfers', icon: 'exchange-alt' },
    ],
  },
  {
    label: 'GST & Finance',
    items: [
      { label: 'GSTR-1', path: '/gst/gstr1', icon: 'file-invoice-dollar' },
      { label: 'GSTR-3B', path: '/gst/gstr3b', icon: 'file-contract' },
      { label: 'E-Invoice', path: '/e-invoice', icon: 'cloud-arrow-up' },
      { label: 'Payments', path: '/payments', icon: 'rupee-sign' },
      { label: 'Expenses', path: '/expenses', icon: 'wallet' },
      { label: 'Credit Notes', path: '/credit-notes', icon: 'file-signature' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Dashboard', path: '/', icon: 'chart-line', end: true },
      { label: 'Sales Report', path: '/reports/sales', icon: 'chart-pie' },
      { label: 'Outstanding', path: '/reports/outstanding', icon: 'hand-holding-dollar' },
      { label: 'Profit & Loss', path: '/reports/profit-loss', icon: 'chart-column' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Drug Schedule Log', path: '/compliance', icon: 'shield-halved' },
      { label: 'Narcotics Register', path: '/narcotics', icon: 'skull-crossbones' },
      { label: 'Drug License', path: '/drug-license', icon: 'certificate' },
      { label: 'Prescriptions', path: '/prescriptions', icon: 'prescription' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Doctors', path: '/doctors', icon: 'user-doctor' },
      { label: 'Patients', path: '/patients', icon: 'bed-pulse' },
      { label: 'Staff', path: '/staff', icon: 'user-gear' },
      { label: 'Delivery Orders', path: '/delivery', icon: 'truck-fast' },
      { label: 'Loyalty Program', path: '/loyalty', icon: 'gift' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { label: 'Company Setup', path: '/company', icon: 'building' },
      { label: 'Branches', path: '/branches', icon: 'code-branch' },
      { label: 'Settings', path: '/settings', icon: 'sliders' },
      { label: 'Barcode Studio', path: '/barcode', icon: 'barcode' },
      { label: 'SMS Logs', path: '/sms-logs', icon: 'comment-sms' },
      { label: 'Audit Trail', path: '/audit', icon: 'clock-rotate-left' },
    ],
  },
];

const quickTiles = [
  { label: 'Sale Bill', sub: 'F2', path: '/sales/new', icon: 'cash-register', tile: 'tile-sale' },
  { label: 'Purchase', sub: 'F6', path: '/purchases/new', icon: 'cart-plus', tile: 'tile-purchase' },
  { label: 'Add Stock', sub: 'F7', path: '/stock-adjustments/new', icon: 'boxes-stacked', tile: 'tile-stock' },
];

const importantLinks = [
  { label: 'GST Portal (File Returns)', url: 'https://www.gst.gov.in/', icon: 'landmark' },
  { label: 'E-Way Bill Portal', url: 'https://ewaybillgst.gov.in/', icon: 'route' },
  { label: 'E-Invoice (IRP)', url: 'https://einvoice1.gst.gov.in/', icon: 'qrcode' },
  { label: 'NPPA Ceiling Prices', url: 'https://www.nppaindia.nic.in/', icon: 'tags' },
  { label: 'CDSCO Notifications', url: 'https://cdsco.gov.in/', icon: 'flask' },
];

const supportLinks = [
  { label: 'Help & Support (WhatsApp)', url: 'https://wa.me/918584885450?text=Hi%20CalcuttaRx%20support!', icon: 'headset' },
  { label: 'Built by Calcutta Node', url: 'https://calcuttanode.vercel.app/about', icon: 'bolt' },
];

export default function Layout() {
  const { user, company, branch, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const paletteInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || 'cashier';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Flatten everything once for the command palette
  const allEntries = useMemo(() => {
    const nav = navSections.flatMap(s => s.items.map(i => ({ type: 'nav', ...i, section: s.label })));
    const actions = quickTiles.map(t => ({ type: 'nav', label: t.label, path: t.path, icon: t.icon, section: 'Quick Actions' }));
    const ext = [...importantLinks, ...supportLinks].map(l => ({ type: 'ext', label: l.label, path: l.url, icon: l.icon, section: 'Links' }));
    return [...actions, ...nav, ...ext];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries.slice(0, 9);
    return allEntries.filter(e => e.label.toLowerCase().includes(q) || (e.section || '').toLowerCase().includes(q)).slice(0, 10);
  }, [query, allEntries]);

  const openPalette = () => {
    setQuery('');
    setSelected(0);
    setPaletteOpen(true);
    setTimeout(() => paletteInputRef.current?.focus(), 40);
  };

  const runEntry = (entry) => {
    if (!entry) return;
    setPaletteOpen(false);
    if (entry.type === 'ext') window.open(entry.path, '_blank', 'noopener');
    else navigate(entry.path);
  };

  /* Global shortcuts — skipped while typing (except Ctrl+K), and F2 yields
     to the billing page's own add-item shortcut while creating a sale. */
  useEffect(() => {
    const handler = (e) => {
      const el = e.target;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(el?.tagName) || el?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (typing) return;
      if (e.key === 'F2' && location.pathname !== '/sales/new') { e.preventDefault(); navigate('/sales/new'); }
      else if (e.key === 'F6') { e.preventDefault(); navigate('/purchases/new'); }
      else if (e.key === 'F7') { e.preventDefault(); navigate('/stock-adjustments/new'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [location.pathname, navigate]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const go = (path) => { setSidebarOpen(false); navigate(path); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200 lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className={`sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand */}
        <div className="flex items-center gap-2 px-3.5 h-16 border-b border-white/5 flex-shrink-0">
          <button className="flex items-center gap-2.5 min-w-0 group" onClick={() => go('/')} title="CalcuttaRx — Home">
            <Logo size={34} />
            {!collapsed && (
              <div className="min-w-0 leading-tight text-left">
                <h1 className="text-[15px] font-extrabold text-white truncate tracking-tight">
                  Calcutta<span className="text-transparent bg-clip-text grad-brand">Rx</span>
                </h1>
                <p className="text-[9.5px] text-slate-500 truncate flex items-center gap-1 uppercase tracking-wider font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {(company?.name && company.name !== 'Pharmacy') ? company.name : branch?.name || 'Main Branch'}
                </p>
              </div>
            )}
          </button>
          <button
            className="hidden lg:flex ml-auto p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fas fa-${collapsed ? 'angle-right' : 'angle-left'} text-xs`}></i>
          </button>
        </div>

        {/* Quick action tiles */}
        <div className={`px-3 pt-3 grid gap-2 flex-shrink-0 ${collapsed ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {quickTiles.map(tile => (
            collapsed ? (
              <button key={tile.path} onClick={() => go(tile.path)} title={`${tile.label} (${tile.sub})`}
                className={`nav-tile-collapsed ${tile.tile}`}>
                <i className={`fas fa-${tile.icon}`}></i>
              </button>
            ) : (
              <button key={tile.path} onClick={() => go(tile.path)}
                className={`nav-tile ${tile.tile}`} title={`${tile.label} — press ${tile.sub}`}>
                <i className={`fas fa-${tile.icon} text-sm mb-1 block`}></i>
                <span className="block text-[10px] font-bold leading-none">{tile.label}</span>
                <span className="block text-[8px] opacity-60 mt-1 font-semibold tracking-widest">{tile.sub}</span>
              </button>
            )
          ))}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5 crx-scroll">
          <button
            onClick={openPalette}
            className="w-full flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-emerald-400/20 transition-all"
            title="Search everything (Ctrl+K)"
          >
            <i className="fas fa-magnifying-glass text-[11px]"></i>
            {!collapsed && <>
              <span>Search or jump to…</span>
              <span className="ml-auto kbd">Ctrl K</span>
            </>}
          </button>

          {navSections.map(section => (
            <div key={section.label}>
              {!collapsed && <p className="sidebar-section-label">{section.label}</p>}
              {collapsed && <div className="mx-auto my-2 h-px w-6 bg-white/10"></div>}
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} ${item.hot && !isActive ? 'nav-hot' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.label : undefined}
                >
                  <i className={`fas fa-${item.icon}`}></i>
                  <span>{item.label}</span>
                  {item.hot && !collapsed && <span className="ml-auto kbd">{item.label === 'New Sale' ? 'F2' : item.label === 'New Purchase' ? 'F6' : 'F7'}</span>}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Important links */}
          {!collapsed && (
            <div className="pt-3 mt-2 border-t border-white/5">
              <p className="sidebar-section-label">Important Links</p>
              {[...importantLinks, ...supportLinks].map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="nav-link nav-ext">
                  <i className={`fas fa-${link.icon}`}></i>
                  <span>{link.label}</span>
                  <i className="fas fa-arrow-up-right-from-square ml-auto text-[8px] opacity-50"></i>
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 p-2.5 flex-shrink-0">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                <div className="w-8 h-8 rounded-lg grad-brand flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-glow-sm">
                  {getInitials(user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate capitalize">{userRole}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <i className="fas fa-power-off text-xs"></i>
                </button>
              </div>
              <a href="https://calcuttanode.vercel.app" target="_blank" rel="noopener noreferrer"
                className="block text-center text-[9px] text-slate-600 hover:text-emerald-400 transition-colors tracking-wide pt-1">
                Powered by <span className="font-bold">CALCUTTA NODE</span> · v2.0 GST
              </a>
            </>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <i className="fas fa-power-off"></i>
            </button>
          )}
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="topbar h-14 px-4 lg:px-6 flex items-center gap-3 flex-shrink-0 no-print z-30">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800 p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
            <Logo size={16} className="opacity-70" />
            {location.pathname.split('/').filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="fas fa-chevron-right text-[7px] text-slate-300"></i>
                <span className={i === arr.length - 1 ? 'text-slate-800 font-bold' : ''}>
                  {part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </span>
            ))}
            {location.pathname === '/' && <span className="text-slate-800 font-bold">Command Centre</span>}
          </div>

          <div className="flex-1"></div>

          {/* Command trigger */}
          <button onClick={openPalette}
            className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-white/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/80 shadow-sm hover:border-emerald-300 hover:text-slate-700 transition-all"
            title="Ctrl+K">
            <i className="fas fa-magnifying-glass text-[10px]"></i> Quick jump…
            <span className="kbd ml-1">⌘K</span>
          </button>

          {/* GST status chip */}
          {company?.gstin && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-emerald-50/80 backdrop-blur px-3 py-1.5 rounded-lg border border-emerald-200/70 shadow-sm">
              <i className="fas fa-file-invoice-dollar text-emerald-500 text-[10px]"></i>
              <span className="font-bold font-mono">{company.gstin.slice(0, 2)}</span>
              <span className="text-emerald-300">|</span>
              <span className="uppercase font-semibold">{company?.drugLicenseCategory || 'retail'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${company?.gstType === 'composition' ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`}></span>
            </div>
          )}

          <NavLink to="/sales/new" className="btn btn-primary btn-sm btn-glow">
            <i className="fas fa-bolt text-[10px]"></i>
            <span className="hidden sm:inline">New Sale</span><span className="sm:hidden">Sale</span>
            <span className="kbd kbd-dark hidden xl:inline">F2</span>
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 crx-scroll">
          <Outlet />
        </main>
      </div>

      {/* ═══════════ COMMAND PALETTE ═══════════ */}
      {paletteOpen && (
        <div className="cmdk-backdrop no-print" onMouseDown={() => setPaletteOpen(false)}>
          <div className="cmdk-panel glass-card" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/60">
              <i className="fas fa-magnifying-glass text-pharma-500"></i>
              <input
                ref={paletteInputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
                  else if (e.key === 'Enter') { e.preventDefault(); runEntry(results[selected]); }
                  else if (e.key === 'Escape') { setPaletteOpen(false); }
                }}
                placeholder="Search pages, actions, portals… try 'sale', 'gst', 'expiry'"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
              />
              <span className="kbd">ESC</span>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2 crx-scroll">
              {results.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">No matches for “{query}”</p>
              )}
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.path}-${i}`}
                  onClick={() => runEntry(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={`cmdk-item ${i === selected ? 'selected' : ''}`}
                >
                  <span className={`cmdk-icon ${r.type === 'ext' ? 'bg-violet-100 text-violet-600' : r.hot ? 'grad-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <i className={`fas fa-${r.icon} text-[11px]`}></i>
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm font-semibold text-slate-700 truncate">{r.label}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{r.section}{r.type === 'ext' ? ' · external' : ''}</span>
                  </span>
                  {i === selected && <i className="fas fa-corner-down-left text-[10px] text-slate-400"></i>}
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-white/60 flex items-center gap-4 text-[10px] text-slate-400">
              <span><span className="kbd">↑↓</span> navigate</span>
              <span><span className="kbd">↵</span> open</span>
              <span className="ml-auto"><i className="fas fa-bolt text-emerald-500 mr-1"></i>F2 Sale · F6 Purchase · F7 Stock</span>
            </div>
          </div>
        </div>
      )}

      <AiAssistant />
    </div>
  );
}
