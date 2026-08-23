import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useWorkspace, MODE_META } from '../context/WorkspaceContext';

function Greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function KpiCard({ icon, label, value, sub, link, grad }) {
  const Card = link ? Link : 'div';
  return (
    <Card to={link} className={`glass-accent p-4 sm:p-5 flex items-start gap-3 sm:gap-4 grad-edge ${link ? 'app-card-hover cursor-pointer' : ''}`}>
      <div className={`color-block color-block-md ${grad || 'grad-hero'} text-white flex-shrink-0`}>
        <i className={`fas fa-${icon} text-sm`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
    </Card>
  );
}

const QUICK_ACTIONS = {
  retail: [
    { label: 'New Sale', path: '/sales/new', icon: 'cash-register', grad: 'grad-brand', glow: 'hover:shadow-glow' },
    { label: 'Purchase', path: '/purchases/new', icon: 'cart-plus', grad: 'grad-cool', glow: 'hover:shadow-glow-indigo' },
    { label: 'Add Medicine', path: '/medicines/new', icon: 'pills', grad: 'grad-warm', glow: 'hover:shadow-glow' },
    { label: 'Prescription', path: '/prescriptions/new', icon: 'prescription', grad: 'grad-gold', glow: 'hover:shadow-glow' },
    { label: 'Customer', path: '/customers/new', icon: 'user-plus', grad: 'grad-warm', glow: 'hover:shadow-glow' },
    { label: 'GSTR-1', path: '/gst/gstr1', icon: 'file-invoice-dollar', grad: 'grad-hero', glow: 'hover:shadow-glow' },
  ],
  wholesale: [
    { label: 'B2B Invoice', path: '/sales/new?type=wholesale', icon: 'file-invoice-dollar', grad: 'grad-cool', glow: 'hover:shadow-glow-indigo' },
    { label: 'Purchase', path: '/purchases/new', icon: 'cart-plus', grad: 'grad-brand', glow: 'hover:shadow-glow' },
    { label: 'Purchase Order', path: '/purchase-orders/new', icon: 'clipboard-list', grad: 'grad-hero', glow: 'hover:shadow-glow' },
    { label: 'Supplier', path: '/suppliers/new', icon: 'truck', grad: 'grad-warm', glow: 'hover:shadow-glow' },
    { label: 'Delivery', path: '/delivery', icon: 'truck-fast', grad: 'grad-gold', glow: 'hover:shadow-glow' },
    { label: 'GSTR-1', path: '/gst/gstr1', icon: 'file-invoice-dollar', grad: 'grad-brand', glow: 'hover:shadow-glow' },
  ],
};

export default function Dashboard() {
  const { user, company } = useAuth();
  const { mode, setMode, isDual } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/dashboard'),
      API.get('/medicines?limit=6&sort=-createdAt'),
      API.get('/inventory/low-stock'),
    ]).then(([dash, meds, lowStock]) => {
      setData({
        ...dash.data,
        recentMeds: meds.data?.medicines || meds.data || [],
        lowStock: Array.isArray(lowStock.data) ? lowStock.data : (lowStock.data?.all || []),
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-12 h-12 rounded-xl grad-accent flex items-center justify-center animate-pulse shadow-glow">
        <i className="fas fa-prescription-bottle-medical text-white"></i>
      </div>
      <p className="text-sm text-slate-400 mt-4">Loading dashboard...</p>
    </div>
  );

  const todaySales = data?.todaySales?.total || 0;
  const monthSales = data?.monthSales?.total || 0;
  const monthBills = data?.monthSales?.count || 0;
  const monthPurchases = data?.monthPurchases?.total || 0;
  const monthPurchaseBills = data?.monthPurchases?.count || 0;
  const totalSuppliers = data?.totalSuppliers ?? 0;
  const lowStockCount = (data?.lowStock || []).filter(Boolean).length;
  const expiringCount = data?.expiringCount || 0;
  const totalMedicines = data?.totalMedicines || 0;
  const totalCustomers = data?.totalCustomers || 0;
  const outstanding = data?.outstandingReceivable ?? data?.outstanding ?? 0;

  const isWs = mode === 'wholesale';
  const quickActions = QUICK_ACTIONS[isWs ? 'wholesale' : 'retail'];

  return (
    <div className="dashboard space-y-5 sm:space-y-6 max-w-[1400px]">

      {/* Welcome banner */}
      <div className="dashboard-header">
          <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
            <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 truncate">
                <i className="fas fa-store mr-1.5"></i>{company?.name || 'Pharmacy'}
              </p>
               <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {Greeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Workspace desk switcher */}
              {isDual && (
                <div className="flex items-center p-0.5 rounded-lg bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm" role="group" aria-label="Switch workspace desk">
                  {['retail', 'wholesale'].map(m => {
                    const active = mode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        aria-pressed={active}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <i className={`fas fa-${MODE_META[m].icon} text-[10px]`}></i>
                        {MODE_META[m].shortLabel}
                      </button>
                    );
                  })}
                </div>
              )}
              <span className={`status-chip ${isWs ? 'status-chip-info' : 'status-chip-success'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isWs ? 'bg-blue-400' : 'bg-emerald-300'}`}></span>
                {MODE_META[mode].label}
              </span>
              {company?.gstin && (
                 <span className="hidden md:inline-flex status-chip">
                  <i className="fas fa-receipt"></i>
                  GSTIN: {company.gstin}
                </span>
              )}
            </div>
          </div>
      </div>

      {/* Mode tagline strip */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium ${
        isWs
          ? 'bg-blue-50/70 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300'
          : 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
      }`}>
        <i className={`fas fa-${MODE_META[mode].icon}`}></i>
        <span><b>{MODE_META[mode].label}</b> — {MODE_META[mode].tagline}{isDual ? '. Switch desks anytime from the toggle above.' : ''}</span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        {isWs ? (
          <>
            <KpiCard icon="indian-rupee-sign" label="Today's sales" value={`₹${todaySales.toLocaleString('en-IN')}`} sub={`${data?.todaySales?.count || 0} bills today`} link="/sales" />
            <KpiCard icon="cart-plus" label="Purchases this month" value={`₹${monthPurchases.toLocaleString('en-IN')}`} sub={`${monthPurchaseBills} inward bills`} link="/purchases" grad="grad-cool" />
            <KpiCard icon="hand-holding-dollar" label="Outstanding dues" value={`₹${outstanding.toLocaleString('en-IN')}`} sub="B2B receivables" link="/reports/outstanding" grad="grad-gold" />
            <KpiCard icon="boxes-stacked" label="Stock exceptions" value={lowStockCount + expiringCount} sub={`${lowStockCount} low stock · ${expiringCount} expiring`} link="/expiry" grad="grad-warm" />
          </>
        ) : (
          <>
            <KpiCard icon="indian-rupee-sign" label="Today's sales" value={`₹${todaySales.toLocaleString('en-IN')}`} sub={`${data?.todaySales?.count || 0} bills today`} link="/sales" />
            <KpiCard icon="receipt" label="Bills this month" value={monthBills} sub={`₹${monthSales.toLocaleString('en-IN')} revenue`} link="/reports/sales" grad="grad-cool" />
            <KpiCard icon="hand-holding-dollar" label="Outstanding dues" value={`₹${outstanding.toLocaleString('en-IN')}`} sub="Receivable amount" link="/reports/outstanding" grad="grad-gold" />
            <KpiCard icon="boxes-stacked" label="Stock exceptions" value={lowStockCount + expiringCount} sub={`${lowStockCount} low stock · ${expiringCount} expiring`} link="/expiry" grad="grad-warm" />
          </>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Left column: Quick Actions + Alerts */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-5">

          {/* Quick Actions — adapt per workspace desk */}
          <div className="glass-accent p-4 sm:p-5 grad-edge">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="color-block color-block-sm grad-hero text-white">
                  <i className="fas fa-bolt text-[11px]"></i>
                </span>
                {isWs ? 'Wholesale Quick Actions' : 'Counter Quick Actions'}
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {quickActions.map(a => (
                <Link key={a.label} to={a.path} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${a.grad} text-white ${a.glow} hover:-translate-y-0.5 transition-all duration-200`}>
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <i className={`fas fa-${a.icon}`}></i>
                  </div>
                  <span className="text-[11px] font-semibold text-center leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Wholesale supply snapshot (only on wholesale desk) */}
          {isWs && (
            <div className="glass-accent p-4 sm:p-5 grad-edge border-l-4 border-l-blue-400">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                  <span className="color-block color-block-sm grad-cool text-white">
                    <i className="fas fa-truck-ramp-box text-[11px]"></i>
                  </span>
                  Supply Snapshot
                </h3>
                <Link to="/suppliers" className="text-xs text-pharma-600 hover:underline font-medium">Suppliers</Link>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <p className="text-base font-bold text-slate-800">{totalSuppliers}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Suppliers</p>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100">
                  <p className="text-base font-bold text-slate-800">₹{(monthPurchases / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Month Inward</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-base font-bold text-slate-800">₹{(monthSales - monthPurchases > 0 ? monthSales - monthPurchases : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sales − Purchase</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link to="/purchase-orders/new" className="quick-pill tile-purchase !text-white"><i className="fas fa-clipboard-list text-[10px]"></i>New PO</Link>
                <Link to="/transfers/new" className="quick-pill tile-stock !text-white"><i className="fas fa-arrow-right-arrow-left text-[10px]"></i>Transfer</Link>
                <Link to="/expenses/new" className="quick-pill"><i className="fas fa-wallet text-[10px]"></i>Expense</Link>
              </div>
            </div>
          )}

          {/* Low Stock Alerts */}
          <div className="glass-accent p-4 sm:p-5 grad-edge border-l-4 border-l-orange-400">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                <span className="color-block color-block-sm grad-gold text-white">
                  <i className="fas fa-exclamation-triangle text-[11px]"></i>
                </span>
                Low Stock Alerts
              </h3>
              <Link to="/stock-adjustments" className="text-xs text-pharma-600 hover:underline font-medium">Manage</Link>
            </div>
            {data?.lowStock?.filter(Boolean)?.length > 0 ? (
              <div className="space-y-1.5">
                {data.lowStock.filter(Boolean).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{item.name || item.medicine?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{item.rackLocation || 'No rack info'}</p>
                    </div>
                    <span className="badge badge-danger ml-2 flex-shrink-0">{item.totalQty ?? item.qty ?? item.stock ?? 0} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-5 text-slate-400">
                <span className="w-8 h-8 rounded-lg bg-pharma-50 dark:bg-pharma-900/30 flex items-center justify-center">
                  <i className="fas fa-check-circle text-pharma-500"></i>
                </span>
                <p className="text-sm">All stock levels are healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Expiring + Medicines */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Expiring Batches */}
          <div className="glass-accent p-4 sm:p-5 grad-edge">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                <span className="color-block color-block-sm grad-gold text-white">
                  <i className="fas fa-clock text-[11px]"></i>
                </span>
                Expiring in 30 Days
              </h3>
              <Link to="/expiry" className="text-xs text-pharma-600 hover:underline font-medium">View All</Link>
            </div>
            {data?.expiringBatches?.length > 0 ? (
              <div className="space-y-2">
                {data.expiringBatches.map((b, i) => {
                  const daysLeft = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-clock text-amber-600 dark:text-amber-300 text-xs"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{b.medicine?.name || 'Unknown'}</p>
                          <p className="text-[11px] text-slate-400">Batch: {b.batchNo} &middot; Qty: {b.qty}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className={`badge ${daysLeft <= 7 ? 'badge-red' : daysLeft <= 14 ? 'badge-orange' : 'badge-yellow'}`}>
                          {daysLeft}d left
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(b.expiryDate).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-6 text-slate-400">
                <span className="w-8 h-8 rounded-lg bg-pharma-50 dark:bg-pharma-900/30 flex items-center justify-center">
                  <i className="fas fa-check-circle text-pharma-500"></i>
                </span>
                <p className="text-sm">No batches expiring in the next 30 days</p>
              </div>
            )}
          </div>

          {/* Medicine Catalog */}
          <div className="glass-accent p-4 sm:p-5 grad-edge">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center gap-2">
                <span className="color-block color-block-sm grad-warm text-white">
                  <i className="fas fa-pills text-[11px]"></i>
                </span>
                Recent Medicines
              </h3>
              <Link to="/medicines" className="text-xs text-pharma-600 hover:underline font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(data?.recentMeds || []).slice(0, 6).map((med, i) => (
                <Link to={`/medicines/${med._id}/edit`} key={i} className="p-3 rounded-xl border border-white/70 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:border-pharma-300 dark:hover:border-pharma-600 hover:shadow-glow-soft hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge text-[9px] ${med.schedule === 'X' ? 'badge-red' : med.schedule === 'H1' ? 'badge-orange' : med.schedule === 'H' ? 'badge-yellow' : 'badge-gray'}`}>
                      {med.schedule || 'OTC'}
                    </span>
                    {med.hsn && <span className="text-[9px] text-slate-400">HSN {med.hsn}</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{med.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{med.manufacturer || 'N/A'}</p>
                  {med.mrp > 0 && <p className="text-sm font-semibold text-pharma-600 dark:text-pharma-400 mt-1.5">₹{med.mrp}</p>}
                </Link>
              ))}
              {(!data?.recentMeds || data.recentMeds.length === 0) && (
                <p className="text-sm text-slate-400 col-span-3 py-8 text-center">No medicines added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="glass-accent p-4 sm:p-5 grad-edge">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="color-block color-block-sm grad-cool text-white">
            <i className="fas fa-chart-bar text-[11px]"></i>
          </span>
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="text-center p-4 rounded-xl grad-hero text-white shadow-glow-sm">
            <p className="text-xl sm:text-2xl font-bold">{isWs ? totalSuppliers : totalCustomers}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">{isWs ? 'Suppliers' : 'Customers'}</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-cool text-white shadow-glow-indigo">
            <p className="text-xl sm:text-2xl font-bold">{isWs ? `₹${(monthPurchases / 1000).toFixed(0)}k` : monthBills}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">{isWs ? 'Month Inward ₹' : 'Monthly Bills'}</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-brand text-white shadow-glow-sm">
            <p className="text-xl sm:text-2xl font-bold">{totalMedicines}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Stock Items</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-gold text-white shadow-glow-sm">
            <p className="text-xl sm:text-2xl font-bold">{expiringCount}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Expiring Soon</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-warm text-white shadow-glow-sm col-span-2 md:col-span-1">
            <p className="text-xl sm:text-2xl font-bold">{lowStockCount}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Low Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}
