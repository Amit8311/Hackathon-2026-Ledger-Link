import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, X, CheckCircle, ShieldCheck, Zap, Users } from 'lucide-react';

const roleRedirect = {
  platform_admin: '/platform',
  firm_admin:     '/firm',
  accountant:     '/accountant',
  company_admin:  '/company',
  company_user:   '/company',
};

const FEATURES = [
  { icon: ShieldCheck, text: 'Bank-grade security for all data transfers' },
  { icon: Zap,         text: 'AI-powered invoice extraction in seconds' },
  { icon: Users,       text: 'Multi-tenant firm & company management' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showForgot, setShowForgot]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotSent, setForgotSent]     = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleRedirect[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await import('../api/client').then(m =>
        m.default.post('/api/auth/forgot-password', { email: forgotEmail })
      );
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Something went wrong. Try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); setForgotError(''); };

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] mesh relative overflow-hidden flex-col justify-between p-12 xl:p-16">

        {/* Decorative shapes */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/[.04] pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-white/[.04] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[.07] pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <span className="text-white font-mono font-bold text-sm leading-none">&gt;_</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">LedgerLink</span>
          </div>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-[36px] xl:text-[42px] font-semibold leading-[1.1] tracking-tight max-w-[14ch]">
              Financial data exchange, simplified.
            </h2>
            <p className="mt-4 text-indigo-200/80 text-[15px] max-w-[36ch] leading-relaxed">
              Connect your accounting firm, companies, and clients in one secure platform.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-indigo-200" />
                </span>
                <span className="text-indigo-100/90 text-[13.5px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <p className="relative z-10 text-indigo-300/50 text-[11.5px] font-mono">
          Trusted by accounting firms · Built for the modern practice
        </p>
      </div>

      {/* ── Right login panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-canvas relative overflow-hidden p-6">
        {/* Subtle background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-25 pointer-events-none"
             style={{ background: 'radial-gradient(circle at top right, #C7D2FE, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
             style={{ background: 'radial-gradient(circle at bottom left, #DDD6FE, transparent 65%)' }} />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile brand (hidden on lg) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                 style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
              <span className="text-white font-mono font-bold text-sm">&gt;_</span>
            </div>
            <h1 className="text-[20px] font-semibold text-ink tracking-tight">LedgerLink</h1>
          </div>

          <div className="card" style={{ boxShadow: '0 1px 0 0 rgba(15,15,17,.06), 0 8px 32px -8px rgba(15,15,17,.16)' }}>
            <div className="mb-7">
              <h1 className="text-[18px] font-semibold text-ink tracking-tight">Sign in</h1>
              <p className="text-ink-3 text-[13px] mt-0.5">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Hidden dummy inputs prevent browser autofill on real fields */}
              <input type="text"     style={{ display: 'none' }} autoComplete="username" />
              <input type="password" style={{ display: 'none' }} autoComplete="current-password" />

              <div>
                <label className="block text-[12.5px] font-medium text-ink-2 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12.5px] font-medium text-ink-2">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[12px] text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    style={{ paddingRight: '2.5rem' }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-[13px] px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-brand w-full mt-2" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-[11px] text-ink-3 font-mono mt-5 bg-canvas rounded-lg px-3 py-2 border border-line">
              admin@ledgerlink.com · admin123
            </p>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────── */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl border border-line p-6 w-full max-w-sm mx-4 animate-modal-in"
               style={{ boxShadow: '0 24px 60px -12px rgba(15,15,17,.18)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-ink">Reset Password</h2>
              <button onClick={closeForgot} className="text-ink-3 hover:text-ink-2 transition-colors">
                <X size={17} />
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <p className="text-[14px] font-semibold text-ink mb-1">Email Sent</p>
                <p className="text-[13px] text-ink-2">
                  A temporary password was sent to <strong>{forgotEmail}</strong>.
                </p>
                <p className="text-[12px] text-ink-3 mt-2">
                  Use it to log in, then change your password from your profile.
                </p>
                <button onClick={closeForgot} className="btn-brand w-full mt-5 justify-center">
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-[13px] text-ink-2">
                  Enter your registered email and we'll send a temporary password.
                </p>
                <div>
                  <label className="block text-[12.5px] font-medium text-ink-2 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                {forgotError && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-[13px] px-3 py-2 rounded-lg">
                    {forgotError}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeForgot} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-brand flex-1" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending…' : 'Send Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
