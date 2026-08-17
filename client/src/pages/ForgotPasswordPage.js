import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendToken = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      if (res.success) {
        setMessage(res.message || 'Reset token generated.');
        if (res.resetToken) setToken(res.resetToken);
        setStep(2);
      }
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await API.post('/auth/reset-password', { email, token, newPassword });
      if (res.success) {
        setMessage('Password reset successfully. Redirecting to sign in...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err?.error || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-pharma-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-pharma-600 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-14 h-14 rounded-2xl bg-pharma-500/20 border border-pharma-500/30 flex items-center justify-center mb-8">
            <i className="fas fa-key text-pharma-400 text-2xl"></i>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Reset Your Password</h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
            Request a reset token, then set a new password to regain access to your pharmacy dashboard.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-pharma-300/30 rounded-full blur-3xl animate-drift"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-focus-300/30 rounded-full blur-3xl animate-drift"></div>
        </div>
        <div className="w-full max-w-sm relative">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl grad-accent flex items-center justify-center mx-auto mb-3 shadow-glow">
              <i className="fas fa-key text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-900">PharmacyBilling</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {step === 1 ? 'Forgot password' : 'Set a new password'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {step === 1
                ? 'Enter the email linked to your account to receive a reset token'
                : `Enter the reset token${token ? ' (we filled it in for you)' : ''} and a new password`}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50/80 backdrop-blur-sm text-red-600 px-4 py-3 rounded-xl text-sm mb-5 border border-red-100 animate-fade-in">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 border border-emerald-100 animate-fade-in">
              <i className="fas fa-circle-check"></i>
              {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendToken} className="space-y-4">
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
              <button type="submit" disabled={loading} className="w-full btn btn-primary btn-glow py-2.5 text-sm">
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Get Reset Token
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reset token</label>
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  required
                  className="app-input font-mono"
                  placeholder="Paste the reset token"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="app-input pr-11"
                    placeholder="Min 6 characters"
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
              <button type="submit" disabled={loading} className="w-full btn btn-primary btn-glow py-2.5 text-sm">
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Resetting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Reset Password
                  </>
                )}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(''); setMessage(''); }} className="w-full text-xs text-slate-500 hover:text-pharma-600">
                <i className="fas fa-arrow-left mr-1"></i>
                Back to email entry
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10"></div></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-slate-400">remembered it?</span>
            </div>
          </div>

          <Link to="/login" className="w-full btn btn-secondary py-2.5 text-sm">
            <i className="fas fa-arrow-right-to-bracket"></i>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}