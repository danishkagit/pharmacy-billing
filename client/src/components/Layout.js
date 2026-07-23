import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: 'chart-pie' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Medicines', path: '/medicines', icon: 'capsules' },
      { label: 'Import', path: '/medicines/import', icon: 'file-import' },
      { label: 'Batches', path: '/batches', icon: 'boxes' },
      { label: 'Expiry', path: '/expiry', icon: 'clock' },
      { label: 'Stock Adjust', path: '/stock-adjustments', icon: 'balance-scale' },
      { label: 'Transfers', path: '/transfers', icon: 'exchange-alt' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { label: 'New Sale', path: '/sales/new', icon: 'plus-circle' },
      { label: 'Sales', path: '/sales', icon: 'cash-register' },
      { label: 'Purchases', path: '/purchases', icon: 'truck' },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: 'clipboard-list' },
      { label: 'Sale Returns', path: '/sale-returns', icon: 'undo' },
      { label: 'Purchase Returns', path: '/purchase-returns', icon: 'rotate-left' },
    ],
  },
  {
    label: 'Contacts',
    items: [
      { label: 'Customers', path: '/customers', icon: 'users' },
      { label: 'Suppliers', path: '/suppliers', icon: 'truck-loading' },
      { label: 'Doctors', path: '/doctors', icon: 'user-md' },
      { label: 'Patients', path: '/patients', icon: 'hospital-user' },
      { label: 'Prescriptions', path: '/prescriptions', icon: 'prescription-bottle' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', path: '/payments', icon: 'money-bill' },
      { label: 'Expenses', path: '/expenses', icon: 'wallet' },
      { label: 'Credit Notes', path: '/credit-notes', icon: 'file-invoice' },
      { label: 'Outstanding', path: '/reports/outstanding', icon: 'hand-holding-usd' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Sales Report', path: '/reports/sales', icon: 'chart-line' },
      { label: 'Profit & Loss', path: '/reports/profit-loss', icon: 'balance-scale' },
      { label: 'GSTR-1', path: '/gst/gstr1', icon: 'file-invoice' },
      { label: 'GSTR-3B', path: '/gst/gstr3b', icon: 'file-invoice-dollar' },
      { label: 'E-Invoice', path: '/e-invoice', icon: 'file-invoice-dollar' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Narcotics', path: '/narcotics', icon: 'skull' },
      { label: 'Schedule Log', path: '/compliance', icon: 'shield-alt' },
      { label: 'Drug License', path: '/drug-license', icon: 'certificate' },
      { label: 'Delivery', path: '/delivery', icon: 'shipping-fast' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Company', path: '/company', icon: 'building' },
      { label: 'Branches', path: '/branches', icon: 'code-branch' },
      { label: 'Staff', path: '/staff', icon: 'user-cog' },
      { label: 'Salesmen', path: '/salesmen', icon: 'user-tie' },
      { label: 'Loyalty', path: '/loyalty', icon: 'gift' },
      { label: 'Barcode', path: '/barcode', icon: 'barcode' },
      { label: 'SMS Logs', path: '/sms-logs', icon: 'sms' },
      { label: 'Audit', path: '/audit', icon: 'history' },
      { label: 'Settings', path: '/settings', icon: 'cog' },
    ],
  },
];

export default function Layout() {
  const { user, company, branch, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isRetail = company?.drugLicenseCategory === 'retail' || company?.drugLicenseCategory === 'both';
  const isWholesale = company?.drugLicenseCategory === 'wholesale' || company?.drugLicenseCategory === 'both';
  const userRole = user?.role || 'cashier';

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:hidden`}
        onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass-sidebar transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-out flex flex-col`}>
        {/* Company header */}
        <div className="px-5 py-5 border-b border-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-morph-xs bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {company?.name?.[0] || 'P'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 leading-tight">{company?.name || 'Pharmacy'}</h2>
                <p className="text-xs text-gray-400">{branch?.name || 'Branch'}</p>
              </div>
            </div>
            <button className="lg:hidden text-gray-400 hover:text-gray-600 p-1" onClick={() => setSidebarOpen(false)}>
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip">{userRole}</span>
            {isRetail && <span className="chip-primary"><i className="fas fa-store mr-1"></i>Retail</span>}
            {isWholesale && <span className="chip-primary"><i className="fas fa-warehouse mr-1"></i>Wholesale</span>}
            {company?.gstin && <span className="chip">GST: {company.gstin.slice(0, 8)}...</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{section.label}</p>
              {section.items.map(item => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'}
                  className={({ isActive }) => `glass-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <i className={`fas fa-${item.icon} w-5 text-center text-xs`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-white/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600 shadow-inner">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Logout">
              <i className="fas fa-sign-out-alt text-xs"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="glass-card-solid rounded-none px-4 lg:px-6 py-3 flex items-center gap-4 no-print z-30 border-b border-gray-100/80">
          <button className="lg:hidden text-gray-500 hover:text-gray-700 p-1" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-bars text-lg"></i>
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            {location.pathname.split('/').filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <i className="fas fa-chevron-right text-[10px]"></i>}
                <span className={i === arr.length - 1 ? 'text-gray-700 font-medium capitalize' : 'capitalize'}>{part.replace(/-/g, ' ')}</span>
              </span>
            ))}
            {location.pathname === '/' && <span className="text-gray-700 font-medium">Dashboard</span>}
          </div>

          <div className="flex-1"></div>

          {/* Quick actions */}
          <NavLink to="/sales/new" className="btn-primary text-xs px-4 py-2">
            <i className="fas fa-plus-circle"></i>
            <span className="hidden sm:inline">New Sale</span>
          </NavLink>
          <NavLink to="/purchases/new" className="btn-secondary text-xs px-4 py-2">
            <i className="fas fa-truck"></i>
            <span className="hidden sm:inline">New Purchase</span>
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
