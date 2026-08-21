import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AiAssistant from './AiAssistant';
import Logo from './Logo';

/* ────────────────────────────────────────────────────────────────
   5 Operational Hubs — Fresh Ledger IA (40→22 links)
   Groups: HOME | BILLING [billing] | STOCK [inventory] | PURCHASES [purchase] | MONEY [accounting||reports]
   MORE group (collapsed by default) holds staff/compliance/systems tools.
   ──────────────────────────────────────────────────────────────── */
const navHubs = [
  {
    id: 'home',
    label: 'Home',
    icon: 'gauge-high',
    items: [
      { label: 'Command Centre Dashboard', path: '/dashboard', icon: 'gauge-high', hot: true },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: 'cash-register',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    rbac: ['billing'],
    items: [
      { label: 'New Sale Bill', path: '/sales/new', icon: 'cart-plus', hot: true, shortcut: 'F2' },
      { label: 'Sales Invoices', path: '/sales', icon: 'receipt' },
      { label: 'Customer Returns', path: '/sale-returns', icon: 'rotate-left', rbac: ['returns'] },
      { label: 'Customer Directory', path: '/customers', icon: 'users' },
      { label: 'Delivery Orders', path: '/delivery', icon: 'truck-fast' },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: 'boxes-stacked',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
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
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    rbac: ['purchase'],
    items: [
      { label: 'New Purchase Inward', path: '/purchases/new', icon: 'file-import', hot: true, shortcut: 'F6' },
      { label: 'Purchase Invoices', path: '/purchases', icon: 'file-invoice' },
      { label: 'Supplier Returns', path: '/purchase-returns', icon: 'undo', rbac: ['purchase+returns'] },
      { label: 'Suppliers Directory', path: '/suppliers', icon: 'truck' },
    ],
  },
  {
    id: 'money',
    label: 'Money',
    icon: 'rupee-sign',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    rbac: ['accounting'],
    items: [
      { label: 'Outstanding Dues', path: '/payments', icon: 'hand-holding-dollar', rbac: ['accounting'] },
      { label: 'Payments & Ledgers', path: '/ledgers', icon: 'rupee-sign', rbac: ['accounting'] },
      { label: 'Expenses', path: '/expenses', icon: 'wallet', rbac: ['accounting'] },
      { label: 'GSTR Filings', path: '/gst/gstr1', icon: 'file-invoice-dollar', rbac: ['accounting'] },
      { label: 'Reports', path: '/reports/sales', icon: 'chart-pie', rbac: ['reports'] },
    ],
  },
  {
    id: 'more',
    label: 'More',
    icon: 'ellipsis-h',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Track expanded state of hubs
  const [openHubs, setOpenHubs] = useState(() => {
    return {
      pos: true,
      procurement: true,
      inventory: true,
      accounts: false,
      compliance: false,
      admin: false,
    };
  });

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState(0);
  const paletteInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || 'Pharmacist';

// RBAC gate — owner/admin bypass; others need explicit permission
  const hasPerm = (flag) => {
    if (user?.role === 'owner' || user?.role === 'admin') return true;
    if (Array.isArray(flag)) return flag.some(item => !!user?.permissions?.[item]);
    return !!user?.permissions?.[flag];
  };

// Filter items by RBAC, skipping un-gated items silently
  const filterItems = (items) => (items || []).filter(it => it.rbac ? hasPerm(it.rbac) : true);

  // Toggle sidebar collapsed and remember
  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Automatically open the hub that contains the current active route
  useEffect(() => {
    const currentPath = location.pathname;
    navHubs.forEach(hub => {
      const visibleItems = filterItems(hub.items);
      if (visibleItems.some(item => item.path === currentPath || (currentPath !== '/' && item.path.startsWith(currentPath)))) {
        setOpenHubs(prev => ({ ...prev, [hub.id]: true }));
      }
    });
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleHub = (hubId) => {
    setOpenHubs(prev => ({ ...prev, [hubId]: !prev[hubId] }));
  };

  // Flatten everything for the command palette
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

  // Global shortcuts
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

  const go = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══════════ MODERN SLEEK SIDEBAR ═══════════ */}
      <aside
        className={`sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'collapsed' : ''}`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-3.5 h-16 border-b border-white/10 flex-shrink-0 bg-black/10">
          <button
            className="flex items-center gap-2.5 min-w-0 group text-left"
            onClick={() => go('/')}
            title="CalcuttaRx Home"
          >
            <Logo size={34} theme={isDark} />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <h1 className="text-[15px] font-extrabold text-white tracking-tight flex items-center gap-1">
                  Calcutta<span className="text-transparent bg-clip-text grad-brand">Rx</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold ml-1 border border-emerald-500/30">v2.5</span>
                </h1>
                <p className="text-[9.5px] text-slate-400 truncate flex items-center gap-1.5 font-medium mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {(company?.name && company.name !== 'Pharmacy') ? company.name : branch?.name || 'Main Counter'}
                </p>
              </div>
            )}
          </button>
          <button
            className="hidden lg:flex ml-auto p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'} text-xs`}></i>
          </button>
        </div>

        {/* Quick Action Tiles (Top Priority Counter Buttons) */}
        <div className={`px-2.5 pt-2.5 pb-1 grid gap-1.5 flex-shrink-0 ${collapsed ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {quickTiles.map(tile => (
            collapsed ? (
              <button
                key={tile.path}
                onClick={() => go(tile.path)}
                title={`${tile.label} (${tile.sub})`}
                className={`nav-tile-collapsed ${tile.tile}`}
              >
                <i className={`fas fa-${tile.icon}`}></i>
              </button>
            ) : (
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
            )
          ))}
        </div>

        {/* Navigation Body */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 crx-scroll">
          {/* Dashboard Direct Link */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
            title={collapsed ? 'Command Centre Dashboard' : undefined}
          >
            <i className="fas fa-gauge-high"></i>
            <span>Command Centre</span>
          </NavLink>

          {/* Quick Search Button */}
          <button
            onClick={openPalette}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 my-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all"
            title="Search pages and shortcuts (Ctrl+K)"
          >
            <i className="fas fa-magnifying-glass text-[11px] text-emerald-400"></i>
            {!collapsed && (
              <>
                <span className="truncate">Quick Jump…</span>
                <span className="ml-auto kbd">Ctrl K</span>
              </>
            )}
          </button>

          {/* 6 Categorized Hub Accordions */}
          {navHubs.map(hub => {
            const visibleItems = filterItems(hub.items);
            if (visibleItems.length === 0) return null;
            const isOpen = openHubs[hub.id] || false;
            const hasActiveChild = visibleItems.some(
              item => location.pathname === item.path || (location.pathname !== '/' && location.pathname.startsWith(item.path))
            );

            return (
              <div key={hub.id} className="pt-1">
                {!collapsed ? (
                  <>
                    <button
                      onClick={() => toggleHub(hub.id)}
                      className={`sidebar-section-header ${isOpen ? 'is-open' : ''} ${hasActiveChild ? 'text-emerald-400' : ''}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <i className={`fas fa-${hub.icon} text-[10px] opacity-70`}></i>
                        <span>{hub.label}</span>
                      </span>
                      <i className={`fas fa-chevron-right text-[8px] transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-400' : 'text-slate-600'}`}></i>
                    </button>
                    {isOpen && (
                      <div className="space-y-0.5 pl-1 animate-fade-in">
                        {visibleItems.map(item => (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                              `nav-link ${isActive ? 'active' : ''} ${item.hot && !isActive ? 'nav-hot' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                          >
                            <i className={`fas fa-${item.icon}`}></i>
                            <span className="truncate">{item.label}</span>
                            {item.shortcut && (
                              <span className="ml-auto kbd">{item.shortcut}</span>
                            )}
                            {item.alert && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1 my-1">
                    <div className="mx-auto my-1.5 h-px w-5 bg-white/10"></div>
                    {visibleItems.map(item => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `nav-link ${isActive ? 'active' : ''}`
                        }
                        onClick={() => setSidebarOpen(false)}
                        title={`${hub.label}: ${item.label}`}
                      >
                        <i className={`fas fa-${item.icon}`}></i>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Statutory Links */}
          {!collapsed && (
            <div className="pt-3 mt-3 border-t border-white/10">
              <p className="sidebar-section-label">Govt & Pharmacy Links</p>
              {importantLinks.slice(0, 3).map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link nav-ext text-slate-400 hover:text-cyan-300"
                >
                  <i className={`fas fa-${link.icon} text-[10px]`}></i>
                  <span className="truncate">{link.label}</span>
                  <i className="fas fa-arrow-up-right-from-square ml-auto text-[8px] opacity-40"></i>
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* User Footer Profile */}
        <div className="border-t border-white/10 p-2.5 flex-shrink-0 bg-black/15">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="w-8 h-8 rounded-lg grad-brand flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Pharmacist'}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {userRole}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <i className={`fas fa-${isDark ? 'sun text-amber-400' : 'moon'} text-xs`}></i>
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <i className="fas fa-power-off text-xs"></i>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <i className={`fas fa-${isDark ? 'sun text-amber-400' : 'moon'} text-xs`}></i>
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <i className="fas fa-power-off text-sm"></i>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="topbar h-14 px-4 lg:px-6 flex items-center gap-3 flex-shrink-0 no-print z-30">
          <button
            className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
            title="Open Menu"
          >
            <i className="fas fa-bars text-base"></i>
          </button>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="hover:text-emerald-600 transition-colors">
              <i className="fas fa-house text-xs text-slate-400 dark:text-slate-500"></i>
            </button>
            {location.pathname.split('/').filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="fas fa-chevron-right text-[8px] text-slate-300 dark:text-slate-600"></i>
                <span className={i === arr.length - 1 ? 'text-slate-900 dark:text-slate-100 font-bold capitalize' : 'text-slate-500 dark:text-slate-400 capitalize'}>
                  {part.replace(/-/g, ' ')}
                </span>
              </span>
            ))}
            {location.pathname === '/' && (
              <>
                <i className="fas fa-chevron-right text-[8px] text-slate-300 dark:text-slate-600"></i>
                <span className="text-slate-900 dark:text-slate-100 font-bold">Command Centre</span>
              </>
            )}
          </div>

          <div className="flex-1"></div>

          {/* Global Quick Search Button */}
          <button
            onClick={openPalette}
            className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:border-emerald-400 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Press Ctrl+K to search"
          >
            <i className="fas fa-magnifying-glass text-[11px] text-emerald-600 dark:text-emerald-400"></i>
            <span>Quick jump & search…</span>
            <span className="kbd kbd-dark ml-2">Ctrl K</span>
          </button>

          {/* Theme Toggle Button in Header */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-500 transition-all shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fas fa-${isDark ? 'sun text-amber-400' : 'moon text-slate-600'} text-xs`}></i>
          </button>

          {/* GST Status Capsule */}
          {company?.gstin && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <i className="fas fa-file-invoice text-emerald-600 dark:text-emerald-400 text-[11px]"></i>
              <span className="font-mono font-bold">{company.gstin.slice(0, 2)}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-semibold uppercase text-[11px]">{company?.drugLicenseCategory || 'Retail'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${company?.gstType === 'composition' ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
            </div>
          )}

          {/* Primary Quick Sale Button */}
          <NavLink to="/sales/new" className="btn btn-primary btn-sm btn-glow font-bold">
            <i className="fas fa-plus text-[10px]"></i>
            <span className="hidden sm:inline">New Sale</span>
            <span className="sm:hidden">Sale</span>
            <span className="kbd kbd-dark hidden md:inline ml-1 font-mono">F2</span>
          </NavLink>
        </header>

        {/* Page Main View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 crx-scroll">
          <Outlet />
        </main>
      </div>

      {/* ═══════════ ENHANCED CATEGORIZED COMMAND PALETTE (Ctrl+K) ═══════════ */}
      {paletteOpen && (
        <div className="cmdk-backdrop no-print" onMouseDown={() => setPaletteOpen(false)}>
          <div className="cmdk-panel glass-card surface-glass-strong" onMouseDown={e => e.stopPropagation()}>
            {/* Input Bar */}
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

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 overflow-x-auto text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'pos', label: 'Billing POS' },
                { id: 'procurement', label: 'Purchases' },
                { id: 'inventory', label: 'Stock' },
                { id: 'accounts', label: 'GST & Accounts' },
                { id: 'compliance', label: 'Compliance' },
                { id: 'portals', label: 'Govt Portals' },
              ].map(cat => (
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

            {/* Results List */}
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

            {/* Footer Navigation Hints */}
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
