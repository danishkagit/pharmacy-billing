import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'chart-pie' },
  { label: 'Medicines', path: '/medicines', icon: 'capsules' },
  { label: 'Import Medicines', path: '/medicines/import', icon: 'file-import' },
  { label: 'Batches', path: '/batches', icon: 'boxes' },
  { label: 'Expiry', path: '/expiry', icon: 'clock' },
  { label: 'Purchases', path: '/purchases', icon: 'truck' },
  { label: 'Sales', path: '/sales', icon: 'cash-register' },
  { label: 'New Sale', path: '/sales/new', icon: 'plus-circle' },
  { label: 'Customers', path: '/customers', icon: 'users' },
  { label: 'Suppliers', path: '/suppliers', icon: 'truck-loading' },
  { label: 'Doctors', path: '/doctors', icon: 'user-md' },
  { label: 'Patients', path: '/patients', icon: 'hospital-user' },
  { label: 'Prescriptions', path: '/prescriptions', icon: 'prescription' },
  { label: 'Payments', path: '/payments', icon: 'money-bill' },
  { label: 'Expenses', path: '/expenses', icon: 'wallet' },
  { label: 'GSTR-1', path: '/gst/gstr1', icon: 'file-invoice' },
  { label: 'GSTR-3B', path: '/gst/gstr3b', icon: 'file-invoice-dollar' },
  { label: 'Sales Report', path: '/reports/sales', icon: 'chart-line' },
  { label: 'Outstanding', path: '/reports/outstanding', icon: 'hand-holding-usd' },
  { label: 'P&L', path: '/reports/profit-loss', icon: 'balance-scale' },
  { label: 'Narcotics', path: '/narcotics', icon: 'skull' },
  { label: 'Compliance', path: '/compliance', icon: 'shield-alt' },
  { label: 'Delivery', path: '/delivery', icon: 'shipping-fast' },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: 'clipboard-list' },
  { label: 'Sale Returns', path: '/sale-returns', icon: 'undo' },
  { label: 'Purchase Returns', path: '/purchase-returns', icon: 'rotate-left' },
  { label: 'Credit/Debit Notes', path: '/credit-notes', icon: 'file-invoice' },
  { label: 'Transfers', path: '/transfers', icon: 'exchange-alt' },
  { label: 'Stock Adjust', path: '/stock-adjustments', icon: 'balance-scale' },
  { label: 'E-Invoice', path: '/e-invoice', icon: 'file-invoice-dollar' },
  { label: 'Drug License', path: '/drug-license', icon: 'certificate' },
  { label: 'Loyalty', path: '/loyalty', icon: 'gift' },
  { label: 'SMS Logs', path: '/sms-logs', icon: 'sms' },
  { label: 'Barcode', path: '/barcode', icon: 'barcode' },
  { label: 'Company', path: '/company', icon: 'building' },
  { label: 'Branches', path: '/branches', icon: 'code-branch' },
  { label: 'Staff', path: '/staff', icon: 'user-cog' },
  { label: 'Salesmen', path: '/salesmen', icon: 'user-tie' },
  { label: 'Audit', path: '/audit', icon: 'history' },
  { label: 'Settings', path: '/settings', icon: 'cog' },
];

export default function Layout() {
  const { user, company, branch, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${sidebarOpen ? '' : 'hidden'} lg:hidden`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out overflow-y-auto`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 truncate">{company?.name || 'Pharmacy'}</h2>
              <p className="text-xs text-gray-500">{branch?.name || 'Branch'}</p>
            </div>
            <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(false)}><i className="fas fa-times"></i></button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{user?.role}</span>
            {company?.gstin && <span>GST: {company.gstin}</span>}
          </div>
        </div>
        <nav className="p-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setSidebarOpen(false)}>
              <i className={`fas fa-${item.icon} w-5 text-center text-xs`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">{user?.name?.[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 no-print">
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><i className="fas fa-bars text-xl"></i></button>
          <div className="flex-1"></div>
          <NavLink to="/sales/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <i className="fas fa-plus-circle"></i> New Sale
          </NavLink>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
