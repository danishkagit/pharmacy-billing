import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandWordmark } from '../components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) navigate('/');
    } catch (err) {
      setError(err?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B1120]">
      {/* Left branding panel — desktop — light background so Rx gradient stays vibrant */}
      <div className="hidden lg:flex lg:w-[52%] bg-white dark:bg-slate-900 relative overflow-hidden border-r border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-12 left-12 w-[28rem] h-[28rem] bg-emerald-50 dark:bg-emerald-900/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 right-12 w-80 h-80 bg-indigo-50 dark:bg-indigo-900/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-56 h-56 bg-teal-50 dark:bg-teal-900/10 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-16 w-full">
          <div className="mb-10 flex flex-col items-start gap-3">
            <img src="/logo-mark.png" alt="CalcuttaRx" width="512" height="512" className="h-[88px] xl:h-[104px] w-auto drop-shadow-lg" />
            <BrandWordmark className="text-[30px] xl:text-[36px] leading-none" />
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Pharmacy Billing · GST · POS</p>
          </div>
          <h1 className="text-[34px] xl:text-[42px] font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white">Pharmacy Billing &amp; <span className="text-pharma-600 dark:text-emerald-400">GST Compliance</span></h1>
          <p className="text-[15px] xl:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mt-4 max-w-[28rem]">
            GST 2.0-ready retail pharmacy suite — billing, batch-wise stock and compliance for Indian pharmacies. Built in Kolkata by Calcutta Node.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-[30rem]">
            {[
              { title: 'GST 2.0 Ready', desc: 'Nil · 5% · 18% · 40% auto', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=260&fit=crop&auto=format', alt: 'GST invoice billing — pharmacy tax invoice with GST calculation' },
              { title: 'Schedule H Compliant', desc: 'H / H1 / X & Narcotics', img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=260&fit=crop&auto=format', alt: 'Pharmacy compliance shield — Schedule H prescription validation' },
              { title: 'Batch & Expiry', desc: 'Expiry alerts by batch', img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=260&fit=crop&auto=format', alt: 'Pharmacy batch and expiry tracking — medicine stock shelves' },
              { title: 'Owner Reports', desc: 'Sales · P&L · Outstanding', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=260&fit=crop&auto=format', alt: 'Pharmacy owner reports — sales and profit analytics dashboard' },
            ].map((item) => (
              <div key={item.title} className="group rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <div className="h-[96px] overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                  <img src={item.img} alt={item.alt} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"></div>
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-white dark:border-slate-700 flex items-center justify-center text-[10px] font-bold">300+</div>
              <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-700 flex items-center justify-center"><i className="fas fa-check text-white text-xs"></i></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Trusted by 300+ Bengal chemists<br /><span className="text-slate-800 dark:text-white font-semibold">Kolkata · Howrah · Siliguri → all WB</span></p>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 overflow-y-auto">
        {/* soft orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-[28rem] h-[28rem] bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-[26rem] h-[26rem] bg-indigo-200/25 dark:bg-indigo-900/15 rounded-full blur-3xl"></div>
        </div>
        <div className="w-full max-w-[420px] relative">
          {/* Mobile brand — big & stacked like landing */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6 sm:mb-8">
            <img src="/logo-mark.png" alt="CalcuttaRx" width="512" height="512" className="h-20 sm:h-24 w-auto drop-shadow-md" />
            <BrandWordmark className="text-[26px] sm:text-[32px] mt-3" />
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400 mt-1">Pharmacy Billing · GST · POS</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[20rem] leading-relaxed">GST 2.0 billing, batch & expiry tracking and GSTR reports — built for Bengal chemists.</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GST 2.0 Ready</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>300+ stores in WB</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[20px] border border-slate-200/70 dark:border-slate-700 shadow-[0_8px_30px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.06)] p-6 sm:p-8">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/30"><i className="fas fa-lock text-[10px]"></i> Secure sign in</span>
              <h2 className="text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">Welcome back</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Sign in to your pharmacy dashboard — billing, stock &amp; GST in one place.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-5 border border-red-200 dark:border-red-800 animate-fade-in">
                <i className="fas fa-circle-exclamation mt-0.5 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fas fa-envelope text-sm"></i></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                    placeholder="you@pharmacy.com"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Password</label>
                  <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fas fa-lock text-sm"></i></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full h-[46px] pl-10 pr-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] btn btn-primary btn-glow text-[15px] font-bold rounded-xl"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right-to-bracket"></i>
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-full">or</span>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full h-[46px] btn btn-secondary text-sm font-bold rounded-xl justify-center"
            >
              <i className="fas fa-store"></i>
              Register New Pharmacy
            </Link>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-2.5">
                <i className="fas fa-bolt text-emerald-500 text-xs mb-1 block"></i>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">GST 2.0 Ready</p>
                <p className="text-[10px] text-slate-400">Auto slabs</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-2.5">
                <i className="fas fa-headset text-indigo-500 text-xs mb-1 block"></i>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">WhatsApp Help</p>
                <p className="text-[10px] text-slate-400">Bangla · Hindi</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-2.5">
                <i className="fas fa-shield-halved text-amber-500 text-xs mb-1 block"></i>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Secure &amp; Compliant</p>
                <p className="text-[10px] text-slate-400">Role-based</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5 px-2">
            For support, contact your administrator · <a href="https://wa.me/918584885450" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-bold">WhatsApp Help</a>
          </p>
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            <BrandWordmark className="align-middle text-slate-700 dark:text-slate-300" /> by <a href="https://calcuttanode.vercel.app/about" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-emerald-600 transition-colors">Calcutta Node.</a> — Kolkata
          </p>
        </div>
      </div>
    </div>
  );
}
