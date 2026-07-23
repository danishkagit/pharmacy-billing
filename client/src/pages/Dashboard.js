import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatsCard } from '../components/ui';

function Greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { user, company } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isRetail = company?.drugLicenseCategory === 'retail' || company?.drugLicenseCategory === 'both';
  const isWholesale = company?.drugLicenseCategory === 'wholesale' || company?.drugLicenseCategory === 'both';

  useEffect(() => {
    Promise.all([
      API.get('/reports/dashboard'),
      API.get('/medicines?limit=5&sort=name'),
      API.get('/inventory/low-stock'),
    ]).then(([dash, meds, lowStock]) => {
      setData({
        ...dash.data,
        recentMeds: meds.data?.medicines || meds.data || [],
        lowStock: lowStock.data || [],
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-12 h-12 rounded-morph-sm bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center animate-pulse">
        <i className="fas fa-capsules text-white text-lg"></i>
      </div>
      <p className="text-sm text-gray-400 mt-4">Loading your dashboard...</p>
    </div>
  );

  const retailCards = [
    { icon: 'cash-register', iconBg: 'rgba(99,102,241,0.12)', label: 'Today Sales', value: `₹${(data?.todaySales?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: `${data?.todaySales?.count || 0} bills today` },
    { icon: 'chart-line', iconBg: 'rgba(34,197,94,0.12)', label: 'This Month Sales', value: `₹${(data?.monthSales?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: `${data?.monthSales?.count || 0} bills this month` },
    { icon: 'capsules', iconBg: 'rgba(168,85,247,0.12)', label: 'Medicines', value: data?.totalMedicines || 0, sub: 'In your catalog', link: '/medicines' },
    { icon: 'exclamation-triangle', iconBg: 'rgba(245,158,11,0.12)', label: 'Low Stock Items', value: (data?.lowStock || []).filter(Boolean).length || 0, sub: 'Need reorder', link: '/stock-adjustments' },
    { icon: 'users', iconBg: 'rgba(20,184,166,0.12)', label: 'Customers', value: data?.totalCustomers || 0, sub: 'Registered patients', link: '/customers' },
    { icon: 'prescription-bottle', iconBg: 'rgba(236,72,153,0.12)', label: 'Expiring in 30d', value: data?.expiringCount || 0, sub: 'Batches to monitor', link: '/expiry' },
  ];

  const wholesaleCards = [
    { icon: 'chart-line', iconBg: 'rgba(59,130,246,0.12)', label: 'Month Sales', value: `₹${(data?.monthSales?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: `${data?.monthSales?.count || 0} invoices` },
    { icon: 'truck', iconBg: 'rgba(34,197,94,0.12)', label: 'Month Purchases', value: `₹${(data?.monthPurchases?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: `${data?.monthPurchases?.count || 0} invoices` },
    { icon: 'wallet', iconBg: 'rgba(245,158,11,0.12)', label: 'Month Expenses', value: `₹${(data?.monthExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: 'Operating costs' },
    { icon: 'hand-holding-usd', iconBg: 'rgba(239,68,68,0.12)', label: 'Outstanding', value: `₹${(data?.outstandingReceivable || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, sub: 'Receivables due', link: '/reports/outstanding' },
    { icon: 'capsules', iconBg: 'rgba(168,85,247,0.12)', label: 'Medicines', value: data?.totalMedicines || 0, sub: 'In catalog', link: '/medicines' },
    { icon: 'truck-loading', iconBg: 'rgba(59,130,246,0.12)', label: 'Suppliers', value: data?.totalSuppliers || 0, sub: 'Active vendors', link: '/suppliers' },
  ];

  const statCards = isRetail && !isWholesale ? retailCards :
    isWholesale && !isRetail ? wholesaleCards :
    [...retailCards.slice(0, 3), ...wholesaleCards.slice(0, 3)];

  return (
    <div className="space-y-6">

      {/* Welcome header */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary-50/50 via-white to-pharma-50/30">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {Greeting()}, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isRetail && isWholesale ? 'Retail & Wholesale' : isRetail ? 'Retail Pharmacy' : 'Wholesale Distribution'}
              {' — '}{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="chip"><i className="fas fa-building mr-1"></i>{company?.name}</span>
            <span className="chip">{company?.gstType === 'composition' ? 'Composition GST' : 'Regular GST'}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatsCard key={i} {...card} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fas fa-bolt text-primary-500"></i> Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {isRetail && (
                <Link to="/sales/new" className="flex flex-col items-center gap-1.5 p-3 rounded-morph-xs bg-gradient-to-br from-primary-50 to-primary-50/50 text-primary-700 hover:from-primary-100 transition-all">
                  <i className="fas fa-cash-register text-lg"></i>
                  <span className="text-xs font-medium">New Sale</span>
                </Link>
              )}
              {isWholesale && (
                <Link to="/sales/new" className="flex flex-col items-center gap-1.5 p-3 rounded-morph-xs bg-gradient-to-br from-blue-50 to-blue-50/50 text-blue-700 hover:from-blue-100 transition-all">
                  <i className="fas fa-file-invoice text-lg"></i>
                  <span className="text-xs font-medium">New Invoice</span>
                </Link>
              )}
              <Link to="/purchases/new" className="flex flex-col items-center gap-1.5 p-3 rounded-morph-xs bg-gradient-to-br from-pharma-50 to-pharma-50/50 text-pharma-700 hover:from-pharma-100 transition-all">
                <i className="fas fa-truck text-lg"></i>
                <span className="text-xs font-medium">Purchase</span>
              </Link>
              <Link to="/medicines/new" className="flex flex-col items-center gap-1.5 p-3 rounded-morph-xs bg-gradient-to-br from-purple-50 to-purple-50/50 text-purple-700 hover:from-purple-100 transition-all">
                <i className="fas fa-capsules text-lg"></i>
                <span className="text-xs font-medium">Add Medicine</span>
              </Link>
              {isRetail && (
                <Link to="/prescriptions/new" className="flex flex-col items-center gap-1.5 p-3 rounded-morph-xs bg-gradient-to-br from-amber-50 to-amber-50/50 text-amber-700 hover:from-amber-100 transition-all">
                  <i className="fas fa-prescription text-lg"></i>
                  <span className="text-xs font-medium">Prescription</span>
                </Link>
              )}
              <Link to="/customers/new" className="flex flex-col items-center gap-1.5 p-3 rounded-morph-xs bg-gradient-to-br from-teal-50 to-teal-50/50 text-teal-700 hover:from-teal-100 transition-all">
                <i className="fas fa-user-plus text-lg"></i>
                <span className="text-xs font-medium">{isRetail ? 'Customer' : 'Party'}</span>
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {data?.lowStock?.filter(Boolean)?.length > 0 && (
            <div className="glass-card p-5 border-l-4 border-l-amber-400">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-amber-500"></i> Low Stock Alerts
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.lowStock.filter(Boolean).slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700 truncate">{item.name || item.medicine?.name || 'Unknown'}</span>
                    <span className="text-xs font-medium text-red-500 ml-2 whitespace-nowrap">{item.qty || item.stock || 0} left</span>
                  </div>
                ))}
              </div>
              <Link to="/stock-adjustments" className="block text-center text-xs text-primary-500 hover:underline mt-2">Manage Stock</Link>
            </div>
          )}
        </div>

        {/* Expiring & Recent */}
        <div className="lg:col-span-2 space-y-4">
          {/* Expiring Batches */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <i className="fas fa-clock text-orange-500"></i> Expiring in 30 Days
              </h2>
              <Link to="/expiry" className="text-xs text-primary-500 hover:underline">View All</Link>
            </div>
            {data?.expiringBatches?.length > 0 ? (
              <div className="space-y-2">
                {data.expiringBatches.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-orange-50/70 backdrop-blur-sm rounded-morph-xs border border-orange-100/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs flex-shrink-0">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{b.medicine?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">Batch: {b.batchNo} | Qty: {b.qty}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-xs font-semibold text-orange-600">{Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
                      <p className="text-[10px] text-gray-400">{new Date(b.expiryDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-6 text-gray-400">
                <i className="fas fa-check-circle text-pharma-500 text-lg"></i>
                <p className="text-sm">No items expiring in the next 30 days</p>
              </div>
            )}
          </div>

          {/* Recent Medicines */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <i className="fas fa-capsules text-purple-500"></i> Medicine Catalog
              </h2>
              <Link to="/medicines" className="text-xs text-primary-500 hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(data?.recentMeds || []).slice(0, 6).map((med, i) => (
                <div key={i} className="p-3 bg-gray-50/50 rounded-morph-xs border border-gray-100/50">
                  <p className="text-xs font-medium text-gray-800 truncate">{med.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{med.manufacturer || 'N/A'}</p>
                  {med.mrp > 0 && <p className="text-xs font-medium text-pharma-600 mt-1">₹{med.mrp}</p>}
                </div>
              ))}
              {(!data?.recentMeds || data.recentMeds.length === 0) && (
                <p className="text-sm text-gray-400 col-span-3 py-4 text-center">No medicines added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Retailer-specific section */}
      {isRetail && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="fas fa-store text-retail-500"></i> Retail Quick Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-retail-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-retail-600">{data?.totalCustomers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total Customers</p>
            </div>
            <div className="text-center p-4 bg-pharma-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-pharma-600">{data?.monthSales?.count || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Monthly Bills</p>
            </div>
            <div className="text-center p-4 bg-purple-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-purple-600">{data?.totalMedicines || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Stock Items</p>
            </div>
            <div className="text-center p-4 bg-amber-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-amber-600">{data?.expiringCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Expiring Soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Wholesaler-specific section */}
      {isWholesale && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="fas fa-warehouse text-wholesale-500"></i> Wholesale Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-blue-600">₹{(data?.monthSales?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-500 mt-1">Monthly Sales</p>
            </div>
            <div className="text-center p-4 bg-pharma-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-pharma-600">₹{(data?.monthPurchases?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-500 mt-1">Monthly Purchases</p>
            </div>
            <div className="text-center p-4 bg-rose-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-rose-600">₹{(data?.outstandingReceivable || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>
            <div className="text-center p-4 bg-amber-50/50 rounded-morph-xs">
              <p className="text-2xl font-bold text-amber-600">{data?.totalSuppliers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Suppliers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
