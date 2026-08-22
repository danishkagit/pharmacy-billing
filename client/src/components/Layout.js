import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace, MODE_META } from '../context/WorkspaceContext';
import AiAssistant from './AiAssistant';
import { Logo, BrandWordmark } from './Logo';

const APP_VERSION = 'v2.5';

/* ────────────────────────────────────────────────────────────────
   Operational Hubs — rendered as horizontal top navigation with
   dropdown menus (desktop) and an accordion drawer (mobile).
   ──────────────────────────────────────────────────────────────── */
const navHubs = [
  {
    id: 'billing',
    label: 'Billing',
    icon: 'cash-register',
    emphasized: true,
    rbac: ['billing'],
    items: [
      { label: 'New Sale Bill', path: '/sales/new', icon: 'cart-plus', hot: true, shortcut: 'F2' },
      { label: 'Sales Invoices', path: '/sales', icon: 'receipt' },
      { label: 'Customer Returns', path: '/sale-returns', icon: 'rotate-left', rbac: ['returns'] },
      { label: 'Customer Directory', path: '/customers', icon: 'users' },
      { label: 'Delivery Orders', path: '/delivery', icon: 'truck-fast' },
      { label: 'Credit Notes', path: '/credit-notes', icon: 'file-circle-minus' },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: 'boxes-stacked',
    rbac: ['inventory'],
    items: [
      { label: 'Add Stock', path: '/stock-adjustments/new', icon: 'plus-circle', hot: true, shortcut: 'F7' },
      { label: 'Batch Stock', path: '/batches', icon: 'boxes' },
      { label: 'Medicines Master', path: '/medicines', icon: 'pills' },
      { label: 'Expiry Tracker', path: '/expiry', icon: 'clock-rotate-left', alert: true },
      { label: 'Branch Transfers', path: '/transfers', icon: 'arrow-right-arrow-left', rbac: ['allBranches'] },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: 'truck-ramp-box',
    rbac: ['purchase'],
    items: [
      { label: 'New Purchase Inward', path: '/purchases/new', icon: 'file-import', hot: true, shortcut: 'F6' },
      { label: 'Purchase Invoices', path: '/purchases', icon: 'file-invoice' },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: 'clipboard-list' },
      { label: 'Supplier Returns', path: '/purchase-returns', icon: 'undo', rbac: ['purchase+returns'] },
      { label: 'Suppliers Directory', path: '/suppliers', icon: 'truck' },
    ],
  },
  {
    id: 'money',
    label: 'Money',
    icon: 'rupee-sign',
    rbac: ['accounting'],
    items: [
      { label: 'Outstanding Dues', path: '/payments', icon: 'hand-holding-dollar', rbac: ['accounting'] },
      { label: 'Expenses', path: '/expenses', icon: 'wallet', rbac: ['accounting'] },
      { label: 'GSTR Filings', path: '/gst/gstr1', icon: 'file-invoice-dollar', rbac: ['accounting'] },
      { label: 'E-Invoice', path: '/e-invoice', icon: 'qrcode', rbac: ['billing'] },
      { label: 'Reports', path: '/reports/sales', icon: 'chart-pie', rbac: ['reports'] },
    ],
  },
  {
    id: 'more',
    label: 'More',
    icon: 'ellipsis-h',
    collapsedByDefault: true,
    rbac: ['staff','settings','compliance'],
    items: [
      { label: 'H/H1/X Register', path: '/compliance', icon: 'shield-halved', rbac: ['compliance'] },
      { label: 'Narcotics Register', path: '/narcotics', icon: 'triangle-exclamation' },
      { label: 'Digital Prescriptions', path: '/prescriptions', icon: 'prescription' },
      { label: 'Doctors', path: '/doctors', icon: 'user-doctor' },
      { label: 'Patients', path: '/patients', icon: 'bed-pulse' },
      { label: 'Drug License', path: '/drug-license', icon: 'certificate', rbac: ['compliance'] },
      { label: 'Staff Management', path: '/staff', icon: 'user-gear', rbac: ['staff'] },
      { label: 'Settings', path: '/settings', icon: 'sliders', rbac: ['settings'] },
    ],
  },
];

const quickTiles = [
  { label: 'New Sale', sub: 'F2', path: '/sales/new', icon: 'cash-register', tile: 'tile-sale' },
  { label: 'Purchase', sub: 'F6', path: '/purchases/new', icon: 'cart-plus', tile: 'tile-purchase' },
  { label: 'Stock In', sub: 'F7', path: '/stock-adjustments/new', icon: 'boxes-stacked', tile: 'tile-stock' },
];

const importantLinks = [
  { label: 'GST Portal (File Returns)', url: 'https://www.gst.gov.in/', icon: 'landmark' },
  { label: 'E-Way Bill Portal', url: 'https://ewaybillgst.gov.in/', icon: 'route' },
  { label: 'E-Invoice (IRP)', url: 'https://einvoice1.gst.gov.in/', icon: 'qrcode' },
  { label: 'NPPA Ceiling Prices', url: 'https://www.nppaindia.nic.in/', icon: 'tags' },
  { label: 'CDSCO Notifications', url: 'https://cdsco.gov.in/', icon: 'flask' },
];

export default function Layout() {
  const { user, company, branch, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { mode: workspaceMode, setMode: setWorkspaceMode, isDual, meta: wsMeta } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileHub, setMobileHub] = useState('billing');
  const [openMenu, setOpenMenu] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState(0);
  const paletteInputRef = useRef(null);
  const hoverTimer = useRef(null);
  const closeTimer = useRef(null);

  const userRole = user?.role || 'Pharmacist';

  const hasPerm = (flag) => {
    if (user?.role === 'owner' || user?.role === 'admin') return true;
    if (Array.isArray(flag)) return flag.some(item => !!user?.permissions?.[item]);
    return !!user?.permissions?.[flag];
  };

  const filterItems = (items) => (items || []).filter(it => it.rbac ? hasPerm(it.rbac) : true);

  const companyName =
    company?.name && company.name !== 'Pharmacy'
      ? company.name
      : branch?.name || 'Main Counter';

  const activeHubId = useMemo(() => {
    let best = null;
    let bestLen = 0;
    navHubs.forEach(hub => {
      filterItems(hub.items).forEach(item => {
        const p = location.pathname;
        if ((p === item.path || p.startsWith(item.path + '/')) && item.path.length > bestLen) {
          best = hub.id;
          bestLen = item.path.length;
        }
      });
    });
    return best;
  }, [location.pathname, user]);

  const openDropdown = (id) => {
    clearTimeout(hoverTimer.current);
    clearTimeout(closeTimer.current);
    setOpenMenu(id);
  };

  const scheduleDropdownClose = () => {
    clearTimeout(hoverTimer.current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 180);
  };

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!openMenu) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest('[data-nav-menu]')) setOpenMenu(null);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  useEffect(() => () => {
    clearTimeout(hoverTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  const allEntries = useMemo(() => {
    const dashboardEntry = [{ type: 'nav', label: 'Command Centre Dashboard', path: '/dashboard', icon: 'gauge-high', section: 'Overview', category: 'home' }];
    const nav = navHubs.flatMap(hub =>
      filterItems(hub.items).map(item => ({
        type: 'nav',
        ...item,
        section: hub.label,
        category: hub.id,
      }))
    );
    const ext = importantLinks.map(link => ({
      type: 'ext',
      label: link.label,
      path: link.url,
      icon: link.icon,
      section: 'Government & Statutory Portals',
      category: 'portals',
    }));
    return [...dashboardEntry, ...nav, ...ext];
  }, [user]);

  const paletteCategories = useMemo(() => ([
    { id: 'all', label: 'All' },
    { id: 'home', label: 'Home' },
    ...navHubs
      .filter(hub => filterItems(hub.items).length > 0)
      .map(hub => ({ id: hub.id, label: hub.label })),
    { id: 'portals', label: 'Govt Portals' },
  ]), [user]);

  const filteredResults = useMemo(() => {
    let list = allEntries;
    if (activeCategory !== 'all') {
      list = list.filter(e => e.category === activeCategory);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 10);
    return list.filter(e =>
      e.label.toLowerCase().includes(q) ||
      (e.section || '').toLowerCase().includes(q) ||
      (e.shortcut || '').toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query, activeCategory, allEntries]);

  const openPalette = () => {
    setQuery('');
    setActiveCategory('all');
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
      if (e.key === 'F2' && location.pathname !== '/sales/new') {
        e.preventDefault();
        navigate('/sales/new');
      } else if (e.key === 'F6') {
        e.preventDefault();
        navigate('/purchases/new');
      } else if (e.key === 'F7') {
        e.preventDefault();
        navigate('/stock-adjustments/new');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [location.pathname, navigate]);

  const getInitials = (name) => {
    if (!name) return 'RX';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const crumbs = useMemo(() => {
    const labelMap = {};
    navHubs.forEach(hub => filterItems(hub.items).forEach(i => { labelMap[i.path] = i.label; }));
    const segments = location.pathname.split('/').filter(Boolean);
    let acc = '';
    return segments.map(seg => {
      acc += `/${seg}`;
      let label = labelMap[acc];
      if (!label && /(new|edit|import)$/.test(acc)) {
        const base = acc.replace(/\/(new|edit|import)$/, '');
        if (labelMap[base]) {
          label = seg === 'new' ? `New ${labelMap[base]}` : seg === 'edit' ? `Edit ${labelMap[base]}` : `Import ${labelMap[base]}`;
        }
      }
      if (!label) {
        label = seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      return label;
    });
  }, [location.pathname, user]);

  const go = (path) => {
    setMobileOpen(false);
    setOpenMenu(null);
    navigate(path);
  };

  const renderDropItems = (hub) => filterItems(hub.items).map(item => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) => `nav-drop-item ${isActive ? 'active' : ''}`}
    >
      <span className={`nav-drop-icon ${item.hot ? 'grad-brand text-white' : ''}`}>
        <i className={`fas fa-${item.icon} text-xs`}></i>
      </span>
      <span className="flex-1 min-w-0 truncate">{item.label}</span>
      {item.shortcut && <span className="kbd kbd-dark font-mono">{item.shortcut}</span>}
      {item.alert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
    </NavLink>
  ));

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ═══════════ HORIZONTAL TOP NAVIGATION ═══════════ */}
      <header className="topnav no-print flex-shrink-0 z-40">
        {/* Main bar */}
        <div className="h-14 px-3 lg:px-5 flex items-center gap-2 lg:gap-3">
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            title="Menu"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <i className={`fas ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
          </button>

          {/* Brand lockup */}
          <button
            className="flex items-center gap-2.5 min-w-0 group text-left"
            onClick={() => go('/dashboard')}
            title="Calcutta Node Home"
          >
            <Logo size={32} />
            <span className="hidden sm:flex flex-col leading-tight min-w-0">
              <span className="flex items-center gap-1.5">
                <BrandWordmark className="text-[15px]" />
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">{APP_VERSION}</span>
              </span>
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 font-medium mt-0.5 max-w-[180px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                {companyName}
              </span>
            </span>
          </button>

          {/* Horizontal hub tabs + dropdowns (desktop) */}
          <nav className="hidden lg:flex items-stretch self-stretch ml-2" onMouseLeave={scheduleDropdownClose}>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <i className="fas fa-gauge-high text-[11px]"></i>
              <span>Home</span>
            </NavLink>

            {navHubs.map(hub => {
              const visibleItems = filterItems(hub.items);
              if (visibleItems.length === 0) return null;
              const isOpen = openMenu === hub.id;
              const isActive = activeHubId === hub.id;
              return (
                <div
                  key={hub.id}
                  className="relative flex items-stretch"
                  data-nav-menu={isOpen ? '' : undefined}
                  onMouseEnter={() => {
                    clearTimeout(closeTimer.current);
                    clearTimeout(hoverTimer.current);
                    hoverTimer.current = setTimeout(() => setOpenMenu(hub.id), 70);
                  }}
                >
                  <button
                    onClick={() => (isOpen ? setOpenMenu(null) : openDropdown(hub.id))}
                    aria-expanded={isOpen}
                    className={`nav-tab ${isActive ? 'active' : ''} ${isOpen ? 'is-open' : ''} ${hub.emphasized && !isActive ? 'nav-tab-billing' : ''}`}
                  >
                    <i className={`fas fa-${hub.icon} text-[11px]`}></i>
                    <span>{hub.label}</span>
                    <i className={`fas fa-chevron-down text-[8px] transition-transform duration-200 ${isOpen ? 'rotate-180' : 'opacity-50'}`}></i>
                  </button>

                  {isOpen && (
                    <div className="nav-dropdown animate-slide-in" data-nav-menu="">
                      <div className={`grid gap-0.5 ${visibleItems.length > 5 ? 'grid-cols-2 min-w-[26rem]' : 'grid-cols-1 min-w-[17rem]'}`}>
                        {renderDropItems(hub)}
                      </div>
                      {hub.id === 'more' && (
                        <div className="mt-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 gap-0.5">
                          {importantLinks.map(link => (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="nav-drop-item nav-ext text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300"
                            >
                              <span className="nav-drop-icon bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-300">
                                <i className={`fas fa-${link.icon} text-xs`}></i>
                              </span>
                              <span className="flex-1 min-w-0 truncate">{link.label}</span>
                              <i className="fas fa-arrow-up-right-from-square text-[8px] opacity-40"></i>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex-1"></div>

          {/* Global Quick Search */}
          <button
            onClick={openPalette}
            className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:border-emerald-400 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Press Ctrl+K to search"
          >
            <i className="fas fa-magnifying-glass text-[11px] text-emerald-600 dark:text-emerald-400"></i>
            <span>Quick jump…</span>
            <span className="kbd kbd-dark">Ctrl K</span>
          </button>
          <button
            onClick={openPalette}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm"
            title="Search (Ctrl+K)"
          >
            <i className="fas fa-magnifying-glass text-sm"></i>
          </button>

          {/* GST Status Capsule */}
          {company?.gstin && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <i className="fas fa-file-invoice text-emerald-600 dark:text-emerald-400 text-[11px]"></i>
              <span className="font-mono font-bold">{company.gstin.slice(0, 2)}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-semibold uppercase text-[11px]">{company?.drugLicenseCategory || 'Retail'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${company?.gstType === 'composition' ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
            </div>
          )}

          {/* Workspace Mode Switcher / Capsule */}
          {isDual ? (
            <div
              className="hidden md:flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
              role="group"
              aria-label="Workspace mode"
            >
              {['retail', 'wholesale'].map(m => {
                const active = workspaceMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setWorkspaceMode(m)}
                    aria-pressed={active}
                    title={`${MODE_META[m].label} — ${MODE_META[m].tagline}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-150 ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <i className={`fas fa-${MODE_META[m].icon} text-[10px]`}></i>
                    <span className="hidden lg:inline">{MODE_META[m].shortLabel}</span>
                    {active && <span className={`w-1.5 h-1.5 rounded-full ${MODE_META[m].dotClass}`}></span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="hidden xl:flex items-center gap-1.5 text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm font-semibold text-slate-600 dark:text-slate-300"
              title={`${wsMeta.label} — ${wsMeta.tagline}`}
            >
              <i className={`fas fa-${wsMeta.icon} text-[11px] text-emerald-600 dark:text-emerald-400`}></i>
              <span>{wsMeta.shortLabel}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-500 transition-all shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fas fa-${isDark ? 'sun text-amber-400' : 'moon text-slate-600'} text-xs`}></i>
          </button>

          {/* Primary Quick Sale Button */}
          <NavLink to="/sales/new" className="btn btn-primary btn-sm btn-glow font-bold">
            <i className="fas fa-plus text-[10px]"></i>
            <span className="hidden sm:inline">New Sale</span>
            <span className="sm:hidden">Sale</span>
            <span className="kbd kbd-dark hidden md:inline ml-1 font-mono">F2</span>
          </NavLink>

          {/* User Menu */}
          <div
            className="relative flex items-center"
            data-nav-menu={openMenu === 'user' ? '' : undefined}
            onMouseEnter={() => {
              clearTimeout(closeTimer.current);
              clearTimeout(hoverTimer.current);
              hoverTimer.current = setTimeout(() => setOpenMenu('user'), 70);
            }}
            onMouseLeave={scheduleDropdownClose}
          >
            <button
              onClick={() => (openMenu === 'user' ? setOpenMenu(null) : openDropdown('user'))}
              aria-expanded={openMenu === 'user'}
              className="w-9 h-9 rounded-lg grad-brand flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-2 ring-white/70 dark:ring-slate-700 hover:shadow-glow-sm transition-shadow"
              title={`${user?.name || 'Pharmacist'} (${userRole})`}
            >
              {getInitials(user?.name)}
            </button>

            {openMenu === 'user' && (
              <div className="nav-dropdown nav-dropdown-right animate-slide-in" data-nav-menu="">
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700/60 mb-1">
                  <div className="w-9 h-9 rounded-lg grad-brand flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {getInitials(user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Pharmacist'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {userRole}
                    </p>
                  </div>
                </div>
                {hasPerm(['settings']) && (
                  <button onClick={() => go('/settings')} className="nav-drop-item">
                    <span className="nav-drop-icon"><i className="fas fa-sliders text-xs"></i></span>
                    <span className="flex-1 text-left">Settings</span>
                  </button>
                )}
                <button onClick={toggleTheme} className="nav-drop-item">
                  <span className="nav-drop-icon"><i className={`fas fa-${isDark ? 'sun' : 'moon'} text-xs`}></i></span>
                  <span className="flex-1 text-left">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button onClick={logout} className="nav-drop-item text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <span className="nav-drop-icon bg-red-50 dark:bg-red-500/10 text-red-500"><i className="fas fa-power-off text-xs"></i></span>
                  <span className="flex-1 text-left font-semibold">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub bar — breadcrumbs + counter quick actions */}
        <div className="subbar hidden sm:flex h-9 px-3 lg:px-5 items-center gap-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0 overflow-hidden whitespace-nowrap" title={crumbs.join(' › ')}>
            <button onClick={() => navigate('/dashboard')} className="hover:text-emerald-600 transition-colors flex-shrink-0">
              <i className="fas fa-house text-xs text-slate-400 dark:text-slate-500"></i>
            </button>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                <i className="fas fa-chevron-right text-[8px] text-slate-300 dark:text-slate-600 flex-shrink-0"></i>
                <span className={i === crumbs.length - 1 ? 'text-slate-900 dark:text-slate-100 font-bold truncate' : 'truncate'}>
                  {c}
                </span>
              </span>
            ))}
          </nav>
          <div className="flex-1"></div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 hidden md:inline">Counter</span>
            {quickTiles.map(tile => (
              <button
                key={tile.path}
                onClick={() => go(tile.path)}
                className={`quick-pill ${tile.tile}`}
                title={`${tile.label} — Shortcut: ${tile.sub}`}
              >
                <i className={`fas fa-${tile.icon} text-[10px]`}></i>
                <span>{tile.label}</span>
                <span className="font-mono opacity-75 text-[9px] font-bold">{tile.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`lg:hidden absolute top-full left-0 right-0 overflow-hidden border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-xl transition-[max-height,opacity] duration-300 ease-out ${
            mobileOpen ? 'max-h-[calc(100vh-3.5rem)] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-y-auto max-h-[calc(100vh-3.5rem)] p-3 space-y-1 crx-scroll">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <i className="fas fa-gauge-high"></i>
              <span>Command Centre</span>
            </NavLink>

            {navHubs.map(hub => {
              const visibleItems = filterItems(hub.items);
              if (visibleItems.length === 0) return null;
              const isOpen = mobileHub === hub.id;
              const isActive = activeHubId === hub.id;
              return (
                <div key={hub.id}>
                  <button
                    onClick={() => setMobileHub(isOpen ? null : hub.id)}
                    className={`sidebar-section-header ${isActive ? 'text-emerald-500' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <i className={`fas fa-${hub.icon} text-[11px]`}></i>
                      <span className="text-xs font-bold">{hub.label}</span>
                    </span>
                    <i className={`fas fa-chevron-right text-[8px] transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-500' : ''}`}></i>
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5 pl-1 animate-fade-in">
                      {visibleItems.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${item.hot && !isActive ? 'nav-hot' : ''}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <i className={`fas fa-${item.icon}`}></i>
                          <span className="truncate">{item.label}</span>
                          {item.shortcut && <span className="ml-auto kbd">{item.shortcut}</span>}
                          {item.alert && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-3 gap-1.5">
              {quickTiles.map(tile => (
                <button
                  key={tile.path}
                  onClick={() => go(tile.path)}
                  className={`nav-tile ${tile.tile}`}
                  title={`${tile.label} — Shortcut: ${tile.sub}`}
                >
                  <i className={`fas fa-${tile.icon} text-xs mb-0.5 block`}></i>
                  <span className="block text-[10px] font-bold leading-none">{tile.label}</span>
                  <span className="block text-[8px] opacity-75 mt-1 font-mono font-bold tracking-widest">{tile.sub}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/60">
              <p className="sidebar-section-label">Govt & Pharmacy Links</p>
              {importantLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link nav-ext text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300"
                >
                  <i className={`fas fa-${link.icon} text-[10px]`}></i>
                  <span className="truncate">{link.label}</span>
                  <i className="fas fa-arrow-up-right-from-square ml-auto text-[8px] opacity-40"></i>
                </a>
              ))}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/60">
              <p className="sidebar-section-label">Workspace</p>
              {isDual ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {['retail', 'wholesale'].map(m => {
                    const active = workspaceMode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setWorkspaceMode(m)}
                        aria-pressed={active}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all ${
                          active
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                        }`}
                      >
                        <i className={`fas fa-${MODE_META[m].icon} text-sm ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}></i>
                        <span className={`text-[11px] font-bold ${active ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {MODE_META[m].shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <i className={`fas fa-${wsMeta.icon} text-emerald-500`}></i>
                  {wsMeta.label} Workspace
                </div>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                <i className={`fas fa-${isDark ? 'sun text-amber-400' : 'moon'}`}></i>
                {isDark ? 'Light' : 'Dark'}
              </button>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 text-xs font-semibold"
              >
                <i className="fas fa-power-off"></i>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 crx-scroll">
        <div key={location.pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      {/* ═══════════ ENHANCED CATEGORIZED COMMAND PALETTE (Ctrl+K) ═══════════ */}
      {paletteOpen && (
        <div className="cmdk-backdrop no-print" onMouseDown={() => setPaletteOpen(false)}>
          <div className="cmdk-panel glass-card surface-glass-strong" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900">
              <i className="fas fa-magnifying-glass text-emerald-600 dark:text-emerald-400 text-sm"></i>
              <input
                ref={paletteInputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelected(s => Math.min(s + 1, filteredResults.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelected(s => Math.max(s - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    runEntry(filteredResults[selected]);
                  } else if (e.key === 'Escape') {
                    setPaletteOpen(false);
                  }
                }}
                placeholder="Search page, counter action, GST return, or shortcut…"
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />
              <span className="kbd kbd-dark">ESC</span>
            </div>

            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 overflow-x-auto text-[11px]">
              {paletteCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSelected(0); }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2 crx-scroll bg-white dark:bg-slate-900">
              {filteredResults.length === 0 && (
                <div className="text-center py-10">
                  <i className="fas fa-search text-slate-300 dark:text-slate-600 text-2xl mb-2"></i>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No results found for “{query}”</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try searching for 'sale', 'batch', 'gstr1', or 'expiry'</p>
                </div>
              )}
              {filteredResults.map((r, i) => (
                <button
                  key={`${r.type}-${r.path}-${i}`}
                  onClick={() => runEntry(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={`cmdk-item ${i === selected ? 'selected' : ''}`}
                >
                  <span className={`cmdk-icon ${
                    r.type === 'ext'
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                      : r.hot
                      ? 'grad-brand text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <i className={`fas fa-${r.icon} text-xs`}></i>
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{r.label}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                      {r.section} {r.type === 'ext' ? '· External Link' : ''}
                    </span>
                  </span>
                  {r.shortcut && (
                    <span className="kbd kbd-dark font-mono text-[10px]">{r.shortcut}</span>
                  )}
                  {i === selected && (
                    <i className="fas fa-arrow-turn-down-left text-xs text-emerald-600 dark:text-emerald-400"></i>
                  )}
                </button>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-3">
                <span><span className="kbd kbd-dark mr-1">↑↓</span> Navigate</span>
                <span><span className="kbd kbd-dark mr-1">↵</span> Select</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold"><i className="fas fa-bolt text-emerald-600 mr-1"></i>F2 Sale · F6 Purchase · F7 Stock</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <AiAssistant />
    </div>
  );
}
