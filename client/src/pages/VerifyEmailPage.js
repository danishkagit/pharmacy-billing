import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { BrandWordmark } from '../components/Logo';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  // Auto-verify if token is in query params
  useEffect(() => {
    if (tokenParam) {
      handleVerifyWithToken(tokenParam);
    }
  }, [tokenParam]);

  const handleVerifyWithToken = async (tok) => {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/verify-email/confirm', { token: tok });
      if (res.success) {
        setSuccess(true);
        setInfo(res.message || 'Email verified successfully!');
      }
    } catch (err) {
      setError(err?.error || 'Verification link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWithOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) return setError('Please enter your email and the 6-digit code');
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/verify-email/confirm', { email: email.trim(), otp: otp.trim() });
      if (res.success) {
        setSuccess(true);
        setInfo(res.message || 'Email verified successfully!');
      }
    } catch (err) {
      setError(err?.error || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) return setError('Enter your email to receive a new code');
    setResending(true);
    setError('');
    setInfo('');
    try {
      const res = await API.post('/auth/verify-email/request', { email: email.trim() });
      if (res.success) {
        setInfo(res.message || 'New verification code sent to your email.');
      }
    } catch (err) {
      setError(err?.error || 'Could not send verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[50%] bg-[var(--bg-card)] relative overflow-hidden border-r border-[var(--border)]">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-12 left-12 w-[28rem] h-[28rem] bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 right-12 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-16 w-full">
          <div className="mb-10 flex flex-col items-start gap-3">
            <img src="/logo-mark.png" alt="CalcuttaRx" width="512" height="512" className="h-[88px] w-auto drop-shadow-lg" />
            <BrandWordmark className="text-[32px] leading-none" />
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Account Security · Email Verification</p>
          </div>
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
            Verify Your Email <span className="text-pharma-600 dark:text-emerald-400">Address</span>
          </h1>
          <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed mt-4 max-w-[28rem]">
            Securing your pharmacy account ensures reliable notifications, GST compliance alerts, and uninterrupted multi-user staff access.
          </p>
        </div>
      </div>

      {/* Right verification form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-[var(--bg-app)]">
        <div className="w-full max-w-[420px] relative">
          <div className="glass-accent rounded-[20px] p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl border border-emerald-200/50 dark:border-emerald-700/30">
                <i className={success ? "fas fa-circle-check" : "fas fa-envelope-circle-check"}></i>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {success ? 'Email Verified!' : 'Email Verification'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {success ? 'Your email is verified and your account is fully active.' : 'Enter the 6-digit verification code sent to your email.'}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-5 border border-red-200 dark:border-red-800 animate-fade-in">
                <i className="fas fa-circle-exclamation mt-0.5 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            {info && !error && (
              <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm mb-5 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
                <i className="fas fa-circle-check mt-0.5 flex-shrink-0"></i>
                <span>{info}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4 pt-2">
                <Link
                  to="/login"
                  className="w-full h-[46px] btn btn-primary btn-glow text-sm font-bold rounded-xl justify-center flex items-center gap-2"
                >
                  <i className="fas fa-arrow-right-to-bracket"></i>
                  Proceed to Sign In
                </Link>
                <Link
                  to="/"
                  className="w-full h-[44px] btn btn-secondary text-sm font-bold rounded-xl justify-center flex items-center gap-2"
                >
                  <i className="fas fa-house"></i>
                  Go to Dashboard
                </Link>
              </div>
            ) : loading && tokenParam ? (
              <div className="py-8 text-center space-y-3">
                <i className="fas fa-spinner fa-spin text-3xl text-emerald-600"></i>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Validating your verification link...</p>
              </div>
            ) : (
              <form onSubmit={handleVerifyWithOtp} className="space-y-4">
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
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">6-Digit Verification Code</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fas fa-shield-halved text-sm"></i></span>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="w-full h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-lg font-mono font-bold tracking-[0.4em] text-center text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6 || !email.trim()}
                  className="w-full h-[48px] btn btn-primary btn-glow text-[15px] font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i> Verifying...</>) : (<><i className="fas fa-check"></i> Verify Email</>)}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <Link to="/login" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-semibold">
                    <i className="fas fa-arrow-left mr-1"></i>Back to Sign In
                  </Link>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resending || !email.trim()}
                    className="text-emerald-600 hover:text-emerald-700 font-bold disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
