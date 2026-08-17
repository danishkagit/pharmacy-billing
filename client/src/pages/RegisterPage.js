import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    companyName: '', gstin: '', dlNo: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = form;
      const res = await register(registerData);
      if (res.success) navigate('/');
    } catch (err) {
      setError(err?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-pharma-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-pharma-600 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-14 h-14 rounded-2xl bg-pharma-500/20 border border-pharma-500/30 flex items-center justify-center mb-8">
            <i className="fas fa-store text-pharma-400 text-2xl"></i>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Setup Your Pharmacy</h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
            Register your retail pharmacy and start billing with full GST compliance and drug regulatory support.
          </p>
          <div className="space-y-4">
            {[
              { icon: 'user-shield', text: 'Secure owner account with role-based access' },
              { icon: 'building', text: 'Multi-branch support with centralized data' },
              { icon: 'file-contract', text: 'Auto GSTR-1, 3B & E-Invoice generation' },
              { icon: 'prescription', text: 'Drug schedule & narcotics register' },
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

      {/* Right registration form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto relative">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-mint-300/30 rounded-full blur-3xl animate-drift"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-focus-300/30 rounded-full blur-3xl animate-float-slow"></div>
        </div>
        <div className="w-full max-w-lg py-4 relative">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl grad-accent flex items-center justify-center mx-auto mb-3 shadow-glow">
              <i className="fas fa-store text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-900">PharmacyBilling</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1.5">Setup your retail pharmacy in minutes</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50/80 backdrop-blur-sm text-red-600 px-4 py-3 rounded-xl text-sm mb-5 border border-red-100 animate-fade-in">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Info */}
            <div className="p-4 rounded-xl glass-card !shadow-soft">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Owner Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="app-input" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="app-input" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="app-input" placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                  <input name="companyName" value={form.companyName} onChange={handleChange} required className="app-input" placeholder="Pharmacy name" />
                </div>
              </div>
            </div>

            {/* Regulatory Info */}
            <div className="p-4 rounded-xl glass-card !shadow-none">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Regulatory Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                  <input name="gstin" value={form.gstin} onChange={handleChange} className="app-input uppercase" placeholder="22AAAAA0000A1Z5" maxLength="15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Drug License No.</label>
                  <input name="dlNo" value={form.dlNo} onChange={handleChange} className="app-input uppercase" placeholder="20B / 21B Number" />
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                  <span>GSTIN and Drug License can be added later from Company Settings. You can start using the system immediately.</span>
                </p>
              </div>
            </div>

            {/* Password */}
            <div className="p-4 rounded-xl glass-card !shadow-none">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Security</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required minLength={6} className="app-input pr-11" placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-pharma-600 transition-colors" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className="app-input pr-11" placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-pharma-600 transition-colors" tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn btn-primary btn-glow py-2.5 text-sm">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-rocket"></i>
                  Create Pharmacy Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Already have an account? <Link to="/login" className="text-pharma-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
