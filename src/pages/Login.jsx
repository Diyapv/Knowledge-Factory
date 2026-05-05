import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Factory, LogIn, Eye, EyeOff, AlertCircle, Sparkles, Lock, UserCircle, Zap, Shield, Code2, Brain, Loader2 } from 'lucide-react';

// Microsoft logo SVG component
function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function Login() {
  const { login, loginWithSSO, ssoEnabled, ssoLoading, ssoError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username.trim(), password);
      if (!result.success) setError(result.error);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      {/* Left side - immersive branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Deep gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-primary-950 to-accent-600/60" />
        
        {/* Animated mesh gradient orbs */}
        <div className="absolute top-16 left-8 w-80 h-80 bg-primary-500/25 rounded-full blur-[80px] animate-blob" />
        <div className="absolute bottom-16 right-8 w-[28rem] h-[28rem] bg-accent-500/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-500/15 rounded-full blur-[80px] animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-[60px] animate-blob" style={{ animationDelay: '6s' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Orbiting dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          <div className="absolute w-2 h-2 bg-primary-400/40 rounded-full animate-orbit" />
          <div className="absolute w-1.5 h-1.5 bg-accent-400/30 rounded-full animate-orbit" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
          <div className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-orbit" style={{ animationDuration: '30s', animationDelay: '-10s' }} />
        </div>

        {/* Floating geometric elements */}
        <div className="absolute top-20 right-16 w-16 h-16 border border-white/10 rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-32 left-12 w-10 h-10 border border-white/8 rounded-xl -rotate-6 animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-primary-500/10 rounded-lg rotate-45 animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20">
          {/* Logo mark */}
          <div className="relative inline-block mb-10 w-fit">
            <div className="absolute inset-0 bg-primary-500/30 rounded-2xl blur-2xl animate-pulse" />
            <div className="absolute inset-0 bg-accent-500/20 rounded-2xl blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 ring-1 ring-white/10">
              <Factory className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-5xl xl:text-[3.5rem] font-black text-white tracking-tight leading-[1.1]">
            Knowledge<br />
            <span className="text-gradient">Factory</span>
          </h1>
          <p className="text-base text-white/50 mt-5 max-w-lg leading-relaxed">
            Your centralized hub for reusable code assets, documentation, and team knowledge — powered by AI intelligence.
          </p>

          {/* Feature cards instead of pills */}
          <div className="grid grid-cols-2 gap-3 mt-10 max-w-md">
            {[
              { icon: Brain, label: 'AI Analysis', desc: 'Smart reusability scoring' },
              { icon: Code2, label: 'Code Library', desc: 'Centralized snippets' },
              { icon: Shield, label: 'Quality Gates', desc: 'Automated checks' },
              { icon: Zap, label: '3x Faster', desc: 'Ship with confidence' },
            ].map((f, i) => (
              <div key={i} className="group px-4 py-3 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <f.icon className="w-4 h-4 text-primary-400 mb-2 group-hover:text-primary-300 transition-colors" />
                <p className="text-sm font-semibold text-white/80">{f.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats with animated appearance */}
          <div className="flex gap-10 mt-14">
            {[
              { value: '100+', label: 'Code Assets' },
              { value: '95%', label: 'Reusability' },
              { value: '3x', label: 'Faster Dev' },
            ].map((s, i) => (
              <div key={i} className="animate-count-up" style={{ animationDelay: `${400 + i * 150}ms` }}>
                <p className="text-3xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center relative bg-white dark:bg-slate-900">
        {/* Decorative gradient bleed from left panel */}
        <div className="hidden lg:block absolute -left-24 top-1/3 w-48 h-96 bg-primary-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-primary-500/[0.03] to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent-500/[0.03] to-transparent rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative w-full max-w-[420px] px-8 sm:px-10 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Factory className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Knowledge Factory</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Sign in to continue</p>
          </div>

          {/* Form header */}
          <div className="hidden lg:block mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-4">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">Secure Login</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome back</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">Enter your credentials to access the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/50 rounded-xl text-sm text-red-600 dark:text-red-400 animate-scale-in">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Username</label>
              <div className="relative group">
                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-100/80 dark:focus:ring-primary-900/30 outline-none transition-all text-sm"
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-100/80 dark:focus:ring-primary-900/30 outline-none transition-all text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 hover:from-primary-500 hover:via-primary-400 hover:to-accent-400 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.01] active:scale-[0.99] text-sm mt-3 btn-shine disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* SSO Section */}
          {ssoEnabled && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                <span className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              </div>

              <button
                onClick={loginWithSSO}
                disabled={ssoLoading}
                className="w-full py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {ssoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <MicrosoftLogo />
                )}
                {ssoLoading ? 'Signing in...' : 'Sign in with Microsoft'}
              </button>

              {ssoError && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/50 rounded-xl text-xs text-amber-600 dark:text-amber-400 animate-scale-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {ssoError}
                </div>
              )}
            </>
          )}

          {/* Bottom tagline */}
          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
            <p className="text-center text-gray-400 dark:text-slate-500 text-xs flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary-400" /> Powered by AI &middot; Built for teams
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
