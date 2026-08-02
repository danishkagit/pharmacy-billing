import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-pharma-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-pharma-600 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-14 h-14 rounded-2xl bg-pharma-500/20 border border-pharma-500/30 flex items-center justify-center mb-8">
            <i className="fas fa-prescription-bottle-medical text-pharma-400 text-2xl"></i>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Pharmacy Billing & GST Compliance</h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
            Complete retail pharmacy management with GST filing, drug schedule tracking, and regulatory compliance for Indian pharmacies.
          </p>
          <div className="space-y-4">
            {[
              { icon: 'file-invoice-dollar', text: 'GST-compliant invoicing with GSTR-1 & 3B' },
              { icon: 'shield-alt', text: 'Schedule H/H1/X & Narcotics compliance' },
              { icon: 'boxes', text: 'Batch tracking with expiry management' },
              { icon: 'chart-line', text: 'Sales reports, P&L & outstanding tracking' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <i className={`fas fa-${item.icon} text-pharma-400 text-sm`}></i>
                </div>
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pharma-500 to-pharma-600 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-prescription-bottle-medical text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-900">PharmacyBilling</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1.5">Enter your credentials to access your pharmacy dashboard</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-5 border border-red-100">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="app-input"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-2.5 text-sm"
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
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or</span>
            </div>
          </div>

          <Link
            to="/register"
            className="w-full btn btn-secondary py-2.5 text-sm"
          >
            <i className="fas fa-store"></i>
            Register New Pharmacy
          </Link>

          <p className="text-center text-xs text-slate-400 mt-6">
            For support, contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
