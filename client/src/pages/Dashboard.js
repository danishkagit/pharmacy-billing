import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function KpiCard({ icon, iconBg, iconColor, label, value, sub, link }) {
  const Card = link ? Link : 'div';
  return (
    <Card to={link} className={`app-card p-5 flex items-start gap-4 ${link ? 'app-card-hover cursor-pointer' : ''}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
        <i className={`fas fa-${icon} text-base`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user, company } = useAuth();
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
  const todayBills = data?.todaySales?.count || 0;
  const monthBills = data?.monthSales?.count || 0;
  const lowStockCount = (data?.lowStock || []).filter(Boolean).length;
  const expiringCount = data?.expiringCount || 0;
  const totalMedicines = data?.totalMedicines || 0;
  const totalCustomers = data?.totalCustomers || 0;
  const outstanding = data?.outstanding || 0;

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Welcome banner */}
      <div className="app-card overflow-hidden">
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pharma-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-drift"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-mint-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-float-slow"></div>
          </div>
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold">
                {Greeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {company?.name || 'Pharmacy'} &middot; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-pharma-400"></span>
                {company?.drugLicenseCategory === 'retail' ? 'Retail' : 'Pharmacy'} License Active
              </span>
              {company?.gstin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium backdrop-blur-sm">
                  GSTIN: {company.gstin}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <KpiCard icon="indian-rupee-sign" iconBg="#f0fdfa" iconColor="#0d9488" label="Today's Sales" value={`₹${todaySales.toLocaleString('en-IN')}`} sub={`${todayBills} bills today`} link="/sales" />
        <KpiCard icon="chart-line" iconBg="#eff6ff" iconColor="#2563eb" label="Monthly Sales" value={`₹${monthSales.toLocaleString('en-IN')}`} sub={`${monthBills} bills this month`} link="/reports/sales" />
        <KpiCard icon="pills" iconBg="#f5f3ff" iconColor="#7c3aed" label="Medicines" value={totalMedicines} sub="In your catalog" link="/medicines" />
        <KpiCard icon="users" iconBg="#fefce8" iconColor="#ca8a04" label="Customers" value={totalCustomers} sub="Registered" link="/customers" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="indian-rupee-sign" iconBg="#fef2f2" iconColor="#dc2626" label="Outstanding" value={`₹${outstanding.toLocaleString('en-IN')}`} sub="Receivable amount" link="/reports/outstanding" />
        <KpiCard icon="exclamation-triangle" iconBg="#fff7ed" iconColor="#ea580c" label="Low Stock" value={lowStockCount} sub="Items below reorder" link="/stock-adjustments" />
        <KpiCard icon="clock" iconBg="#fefce8" iconColor="#ca8a04" label="Expiring Soon" value={expiringCount} sub="Within 30 days" link="/expiry" />
        <KpiCard icon="shield-alt" iconBg="#f0fdfa" iconColor="#0d9488" label="Compliance" value={expiringCount === 0 ? 'OK' : expiringCount} sub={expiringCount === 0 ? 'All clear' : 'Items need review'} link="/compliance" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column: Quick Actions + Alerts */}
        <div className="lg:col-span-1 space-y-5">

          {/* Quick Actions */}
          <div className="app-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <Link to="/sales/new" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-pharma-50 text-pharma-700 hover:bg-pharma-100 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-pharma-500/10 flex items-center justify-center">
                  <i className="fas fa-cash-register"></i>
                </div>
                <span className="text-[11px] font-medium">New Sale</span>
              </Link>
              <Link to="/purchases/new" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <i className="fas fa-cart-plus"></i>
                </div>
                <span className="text-[11px] font-medium">Purchase</span>
              </Link>
              <Link to="/medicines/new" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <i className="fas fa-pills"></i>
                </div>
                <span className="text-[11px] font-medium">Add Medicine</span>
              </Link>
              <Link to="/prescriptions/new" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <i className="fas fa-prescription"></i>
                </div>
                <span className="text-[11px] font-medium">Prescription</span>
              </Link>
              <Link to="/customers/new" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <i className="fas fa-user-plus"></i>
                </div>
                <span className="text-[11px] font-medium">Customer</span>
              </Link>
              <Link to="/gst/gstr1" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <i className="fas fa-file-invoice-dollar"></i>
                </div>
                <span className="text-[11px] font-medium">GSTR-1</span>
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="app-card p-5 border-l-4 border-l-orange-400">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-orange-500 text-xs"></i>
                </span>
                Low Stock Alerts
              </h3>
              <Link to="/stock-adjustments" className="text-xs text-pharma-600 hover:underline font-medium">Manage</Link>
            </div>
            {data?.lowStock?.filter(Boolean)?.length > 0 ? (
              <div className="space-y-1.5">
                {data.lowStock.filter(Boolean).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate">{item.name || item.medicine?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{item.rackLocation || 'No rack info'}</p>
                    </div>
                    <span className="badge badge-red ml-2 flex-shrink-0">{item.qty || item.stock || 0} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-5 text-slate-400">
                <span className="w-8 h-8 rounded-lg bg-pharma-50 flex items-center justify-center">
                  <i className="fas fa-check-circle text-pharma-500"></i>
                </span>
                <p className="text-sm">All stock levels are healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Expiring + Medicines */}
        <div className="lg:col-span-2 space-y-5">

          {/* Expiring Batches */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                  <i className="fas fa-clock text-amber-500 text-xs"></i>
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
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-clock text-amber-600 text-xs"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{b.medicine?.name || 'Unknown'}</p>
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
                <span className="w-8 h-8 rounded-lg bg-pharma-50 flex items-center justify-center">
                  <i className="fas fa-check-circle text-pharma-500"></i>
                </span>
                <p className="text-sm">No batches expiring in the next 30 days</p>
              </div>
            )}
          </div>

          {/* Medicine Catalog */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                  <i className="fas fa-pills text-violet-500 text-xs"></i>
                </span>
                Recent Medicines
              </h3>
              <Link to="/medicines" className="text-xs text-pharma-600 hover:underline font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(data?.recentMeds || []).slice(0, 6).map((med, i) => (
                <Link to={`/medicines/${med._id}/edit`} key={i} className="p-3 rounded-xl border border-white/70 bg-white/60 backdrop-blur-md hover:border-pharma-300 hover:shadow-glow-soft hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge text-[9px] ${med.schedule === 'X' ? 'badge-red' : med.schedule === 'H1' ? 'badge-orange' : med.schedule === 'H' ? 'badge-yellow' : 'badge-gray'}`}>
                      {med.schedule || 'OTC'}
                    </span>
                    {med.hsn && <span className="text-[9px] text-slate-400">HSN {med.hsn}</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">{med.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{med.manufacturer || 'N/A'}</p>
                  {med.mrp > 0 && <p className="text-sm font-semibold text-pharma-600 mt-1.5">₹{med.mrp}</p>}
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
      <div className="app-card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
            <i className="fas fa-chart-bar text-slate-500 text-xs"></i>
          </span>
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-xl bg-pharma-50/60 border border-pharma-100">
            <p className="text-2xl font-bold text-pharma-600">{totalCustomers}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Customers</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">{monthBills}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Monthly Bills</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-violet-50/60 border border-violet-100">
            <p className="text-2xl font-bold text-violet-600">{totalMedicines}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Stock Items</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-orange-50/60 border border-orange-100">
            <p className="text-2xl font-bold text-orange-600">{expiringCount}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Expiring Soon</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-rose-50/60 border border-rose-100">
            <p className="text-2xl font-bold text-rose-600">{lowStockCount}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Low Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}
