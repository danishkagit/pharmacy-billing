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

function KpiCard({ icon, iconBg, iconColor, label, value, sub, link, grad }) {
  const Card = link ? Link : 'div';
  return (
    <Card to={link} className={`glass-accent p-5 flex items-start gap-4 grad-edge ${link ? 'app-card-hover cursor-pointer' : ''}`}>
      <div className={`color-block color-block-md ${grad || 'grad-hero'} text-white flex-shrink-0`}>
        <i className={`fas fa-${icon} text-sm`}></i>
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
      <div className="glass-accent overflow-hidden shimmer-sweep">
        <div className="relative p-6 grad-hero animate-gradient-x text-white overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-drift"></div>
            <div className="absolute bottom-0 left-10 w-52 h-52 bg-mint-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-float-slow"></div>
            <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-focus-300 rounded-full blur-3xl animate-float-slower"></div>
          </div>
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-1.5">
                <i className="fas fa-store mr-1.5"></i>{company?.name || 'Pharmacy'}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {Greeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-sm text-white/75 mt-1.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-xs font-medium backdrop-blur-sm border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                {company?.drugLicenseCategory === 'retail' ? 'Retail' : 'Pharmacy'} License Active
              </span>
              {company?.gstin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-xs font-medium backdrop-blur-sm border border-white/20">
                  <i className="fas fa-receipt"></i>
                  GSTIN: {company.gstin}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 stagger">
        <KpiCard icon="indian-rupee-sign" grad="grad-hero" label="Today's Sales" value={`₹${todaySales.toLocaleString('en-IN')}`} sub={`${todayBills} bills today`} link="/sales" />
        <KpiCard icon="chart-line" grad="grad-cool" label="Monthly Sales" value={`₹${monthSales.toLocaleString('en-IN')}`} sub={`${monthBills} bills this month`} link="/reports/sales" />
        <KpiCard icon="pills" grad="grad-warm" label="Medicines" value={totalMedicines} sub="In your catalog" link="/medicines" />
        <KpiCard icon="users" grad="grad-gold" label="Customers" value={totalCustomers} sub="Registered" link="/customers" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        <KpiCard icon="indian-rupee-sign" grad="grad-cool" label="Outstanding" value={`₹${outstanding.toLocaleString('en-IN')}`} sub="Receivable amount" link="/reports/outstanding" />
        <KpiCard icon="exclamation-triangle" grad="grad-gold" label="Low Stock" value={lowStockCount} sub="Items below reorder" link="/stock-adjustments" />
        <KpiCard icon="clock" grad="grad-warm" label="Expiring Soon" value={expiringCount} sub="Within 30 days" link="/expiry" />
        <KpiCard icon="shield-alt" grad="grad-hero" label="Compliance" value={expiringCount === 0 ? 'OK' : expiringCount} sub={expiringCount === 0 ? 'All clear' : 'Items need review'} link="/compliance" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column: Quick Actions + Alerts */}
        <div className="lg:col-span-1 space-y-5">

          {/* Quick Actions */}
          <div className="glass-accent p-5 grad-edge">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="color-block color-block-sm grad-hero text-white">
                <i className="fas fa-bolt text-[11px]"></i>
              </span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <Link to="/sales/new" className="flex flex-col items-center gap-2 p-3 rounded-xl grad-brand text-white hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="fas fa-cash-register"></i>
                </div>
                <span className="text-[11px] font-semibold">New Sale</span>
              </Link>
              <Link to="/purchases/new" className="flex flex-col items-center gap-2 p-3 rounded-xl grad-cool text-white hover:-translate-y-0.5 hover:shadow-glow-indigo transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="fas fa-cart-plus"></i>
                </div>
                <span className="text-[11px] font-semibold">Purchase</span>
              </Link>
              <Link to="/medicines/new" className="flex flex-col items-center gap-2 p-3 rounded-xl grad-warm text-white hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="fas fa-pills"></i>
                </div>
                <span className="text-[11px] font-semibold">Add Medicine</span>
              </Link>
              <Link to="/prescriptions/new" className="flex flex-col items-center gap-2 p-3 rounded-xl grad-gold text-white hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="fas fa-prescription"></i>
                </div>
                <span className="text-[11px] font-semibold">Prescription</span>
              </Link>
              <Link to="/customers/new" className="flex flex-col items-center gap-2 p-3 rounded-xl grad-warm text-white hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="fas fa-user-plus"></i>
                </div>
                <span className="text-[11px] font-semibold">Customer</span>
              </Link>
              <Link to="/gst/gstr1" className="flex flex-col items-center gap-2 p-3 rounded-xl grad-hero text-white hover:-translate-y-0.5 hover:shadow-glow transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="fas fa-file-invoice-dollar"></i>
                </div>
                <span className="text-[11px] font-semibold">GSTR-1</span>
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="glass-accent p-5 grad-edge border-l-4 border-l-orange-400">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
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
          <div className="glass-accent p-5 grad-edge">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
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
          <div className="glass-accent p-5 grad-edge">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="color-block color-block-sm grad-warm text-white">
                  <i className="fas fa-pills text-[11px]"></i>
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
      <div className="glass-accent p-5 grad-edge">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <span className="color-block color-block-sm grad-cool text-white">
            <i className="fas fa-chart-bar text-[11px]"></i>
          </span>
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-xl grad-hero text-white shadow-glow-sm">
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Customers</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-cool text-white shadow-glow-indigo">
            <p className="text-2xl font-bold">{monthBills}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Monthly Bills</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-brand text-white shadow-glow-sm">
            <p className="text-2xl font-bold">{totalMedicines}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Stock Items</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-gold text-white shadow-glow-sm">
            <p className="text-2xl font-bold">{expiringCount}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Expiring Soon</p>
          </div>
          <div className="text-center p-4 rounded-xl grad-warm text-white shadow-glow-sm">
            <p className="text-2xl font-bold">{lowStockCount}</p>
            <p className="text-[11px] mt-1 font-medium text-white/80">Low Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}
