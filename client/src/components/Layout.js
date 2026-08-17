import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AiAssistant from './AiAssistant';

const navSections = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', path: '/', icon: 'chart-line', end: true },
    ],
  },
  {
    label: 'Billing & Sales',
    items: [
      { label: 'New Sale', path: '/sales/new', icon: 'plus-circle', accent: true },
      { label: 'Sales History', path: '/sales', icon: 'receipt' },
      { label: 'Sale Returns', path: '/sale-returns', icon: 'rotate-left' },
      { label: 'Customers', path: '/customers', icon: 'users' },
    ],
  },
  {
    label: 'Purchases',
    items: [
      { label: 'New Purchase', path: '/purchases/new', icon: 'cart-plus' },
      { label: 'Purchase History', path: '/purchases', icon: 'file-invoice' },
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
      { label: 'Expiry Tracker', path: '/expiry', icon: 'clock' },
      { label: 'Stock Adjustments', path: '/stock-adjustments', icon: 'sliders-h' },
      { label: 'Import Data', path: '/medicines/import', icon: 'file-import' },
      { label: 'Transfers', path: '/transfers', icon: 'exchange-alt' },
    ],
  },
  {
    label: 'Compliance & Regulatory',
    items: [
      { label: 'Drug Schedule Log', path: '/compliance', icon: 'shield-alt' },
      { label: 'Narcotics Register', path: '/narcotics', icon: 'ski-boot' },
      { label: 'Drug License', path: '/drug-license', icon: 'certificate' },
      { label: 'Prescriptions', path: '/prescriptions', icon: 'prescription' },
    ],
  },
  {
    label: 'Finance & GST',
    items: [
      { label: 'Payments', path: '/payments', icon: 'rupee-sign' },
      { label: 'Expenses', path: '/expenses', icon: 'wallet' },
      { label: 'Credit Notes', path: '/credit-notes', icon: 'file-alt' },
      { label: 'GSTR-1', path: '/gst/gstr1', icon: 'file-invoice-dollar' },
      { label: 'GSTR-3B', path: '/gst/gstr3b', icon: 'file-contract' },
      { label: 'E-Invoice', path: '/e-invoice', icon: 'cloud-upload-alt' },
      { label: 'Outstanding', path: '/reports/outstanding', icon: 'hand-holding-usd' },
      { label: 'Profit & Loss', path: '/reports/profit-loss', icon: 'chart-bar' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Sales Report', path: '/reports/sales', icon: 'chart-pie' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Doctors', path: '/doctors', icon: 'user-md' },
      { label: 'Patients', path: '/patients', icon: 'hospital-user' },
      { label: 'Staff', path: '/staff', icon: 'user-cog' },
      { label: 'Salesmen', path: '/salesmen', icon: 'id-badge' },
    ],
  },
  {
    label: 'Tools & Settings',
    items: [
      { label: 'Barcode Generator', path: '/barcode', icon: 'barcode' },
      { label: 'Loyalty Program', path: '/loyalty', icon: 'gift' },
      { label: 'SMS Logs', path: '/sms-logs', icon: 'sms' },
      { label: 'Delivery Orders', path: '/delivery', icon: 'shipping-fast' },
      { label: 'Audit Trail', path: '/audit', icon: 'history' },
      { label: 'Company Setup', path: '/company', icon: 'building' },
      { label: 'Branch Setup', path: '/branches', icon: 'code-branch' },
      { label: 'Settings', path: '/settings', icon: 'cog' },
    ],
  },
];

export default function Layout() {
  const { user, company, branch, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || 'cashier';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/8 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg grad-hero flex items-center justify-center text-white flex-shrink-0 shadow-glow-sm">
            <i className="fas fa-prescription-bottle-medical text-sm"></i>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate leading-tight">{company?.name || 'Pharmacy'}</h1>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full grad-brand"></span>
                {branch?.name || 'Main Branch'}
              </p>
            </div>
          )}
          <button
            className="hidden lg:flex ml-auto p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fas fa-${collapsed ? 'angle-right' : 'angle-left'} text-xs`}></i>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="sidebar-section-label">{section.label}</p>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} ${item.accent ? 'text-pharma-400 hover:text-pharma-300' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.label : undefined}
                >
                  <i className={`fas fa-${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/8 p-3 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-lg grad-hero flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-glow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-pharma-400"></span>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <i className="fas fa-sign-out-alt text-xs"></i>
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="topbar h-14 px-4 lg:px-6 flex items-center gap-4 flex-shrink-0 no-print z-30">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            {location.pathname.split('/').filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <i className="fas fa-chevron-right text-[8px] text-slate-300"></i>}
                <span className={i === arr.length - 1 ? 'text-slate-700 font-medium' : ''}>
                  {part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </span>
            ))}
            {location.pathname === '/' && <span className="text-slate-700 font-medium">Dashboard</span>}
          </div>

          <div className="flex-1"></div>

          {/* GST Status */}
          {company?.gstin && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/70 shadow-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${company?.drugLicenseCategory === 'retail' ? 'bg-pharma-400' : 'bg-blue-400'}`}></span>
              <span className="font-medium">{company.gstin.slice(0, 2)}</span>
              <span className="text-slate-300">|</span>
              <span className="uppercase">{company?.drugLicenseCategory || 'Retail'}</span>
            </div>
          )}

          {/* Quick actions */}
          <NavLink to="/sales/new" className="btn btn-primary btn-sm">
            <i className="fas fa-plus text-[10px]"></i>
            <span className="hidden sm:inline">New Sale</span>
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <AiAssistant />
    </div>
  );
}
