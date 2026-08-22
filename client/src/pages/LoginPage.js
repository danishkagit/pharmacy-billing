import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoImage, BrandWordmark } from '../components/Logo';

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
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 grad-hero animate-gradient-x relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-focus-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-mint-200 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <LogoImage height={72} light />
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">Pharmacy Billing &amp; GST Compliance</h1>
          <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-md">
            GST 2.0-ready retail pharmacy suite — billing, batch-wise stock and compliance for Indian pharmacies. Built in Kolkata by Calcutta Node.
          </p>
          <div className="space-y-4">
            {[
              { icon: 'file-invoice-dollar', text: 'GST-compliant invoicing with GSTR-1 & 3B' },
              { icon: 'shield-alt', text: 'Schedule H/H1/X & Narcotics compliance' },
              { icon: 'boxes', text: 'Batch tracking with expiry management' },
              { icon: 'chart-line', text: 'Sales reports, P&L & outstanding tracking' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <i className={`fas fa-${item.icon} text-white text-sm`}></i>
                </div>
                <span className="text-sm text-white/85">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-pharma-300/30 rounded-full blur-3xl animate-drift"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-focus-300/30 rounded-full blur-3xl animate-drift"></div>
        </div>
        <div className="w-full max-w-sm relative">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Logo size={40} />
            <BrandWordmark className="text-xl" />
          </div>

          <div className="glass-accent p-8 grad-edge">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1.5">Enter your credentials to access your pharmacy dashboard</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50/80 backdrop-blur-sm text-red-600 px-4 py-3 rounded-xl text-sm mb-5 border border-red-100 animate-fade-in">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="app-input"
                  placeholder="you@pharmacy.com"
                  autoFocus
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-pharma-600 hover:text-pharma-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="app-input pr-11"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-pharma-600 transition-colors"
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
                className="w-full btn btn-primary btn-glow py-2.5 text-sm"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right-to-bracket"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10"></div></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-slate-400 bg-white/60 rounded-full">or</span>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full btn btn-secondary py-2.5 text-sm"
            >
              <i className="fas fa-store"></i>
              Register New Pharmacy
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            For support, contact your administrator · <a href="https://wa.me/918584885450" target="_blank" rel="noopener noreferrer" className="text-pharma-600 hover:underline font-semibold">WhatsApp Help</a>
          </p>
          <p className="text-center text-[10px] text-slate-400/80 mt-2">
            CalcuttaRx by <a href="https://calcuttanode.vercel.app/about" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-emerald-600 transition-colors">Calcutta Node.</a> — Kolkata
          </p>
        </div>
      </div>
    </div>
  );
}
