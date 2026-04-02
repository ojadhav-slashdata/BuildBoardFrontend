import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const redirectByRole = {
  Employee: '/portal',
  Manager: '/approvals',
  Admin: '/analytics',
};

// Animated flow steps for the concept video
const FLOW_STEPS = [
  { icon: '💡', title: 'Submit Ideas', desc: 'Anyone can propose innovation ideas', color: '#6366f1' },
  { icon: '✅', title: 'Manager Approves', desc: 'Sets size, complexity & bidding window', color: '#10b981' },
  { icon: '🏗️', title: 'Teams Bid & Build', desc: 'Solo or team bids ranked by performance', color: '#f59e0b' },
  { icon: '⏱️', title: 'Track Progress', desc: 'Daily hours, burndown & comments', color: '#3b82f6' },
  { icon: '⭐', title: 'Get Rated', desc: 'Manager rates delivery quality', color: '#8b5cf6' },
  { icon: '🏆', title: 'Earn Rewards', desc: 'Points → Marketplace rewards', color: '#ec4899' },
];

const STATS = [
  { label: 'Ideas Shipped', value: '150+', icon: 'rocket_launch' },
  { label: 'Innovation Hours', value: '2,400+', icon: 'schedule' },
  { label: 'Points Awarded', value: '45K+', icon: 'stars' },
  { label: 'Team Members', value: '80+', icon: 'group' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showStats, setShowStats] = useState(false);

  // Auto-advance the animated flow — fast 1.5s per step
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % FLOW_STEPS.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Show stats after initial load
  useEffect(() => {
    const t = setTimeout(() => setShowStats(true), 500);
    return () => clearTimeout(t);
  }, []);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const firebaseUser = result.user;
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        pictureUrl: firebaseUser.photoURL,
        role: 'Employee',
      };
      login(idToken, userData);
      navigate(redirectByRole[userData.role] || '/portal');
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container-low" />
        <div className="absolute inset-0 tech-pattern" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16">

          {/* Left: Animated Concept Presentation */}
          <div className="hidden lg:flex flex-col col-span-6 space-y-8">
            {/* Brand */}
            <div className="space-y-4">
              <span className="inline-flex px-4 py-1.5 rounded-full bg-surface-container-high text-primary font-inter text-xs font-semibold tracking-wider uppercase">
                Internal Innovation Portal
              </span>
              <h1 className="text-5xl font-manrope font-extrabold tracking-tighter text-on-background leading-[1.1]">
                Build<span className="text-primary">Board</span>
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed max-w-md">
                Where ideas become reality. Submit, bid, build, earn — your company's innovation engine.
              </p>
            </div>

            {/* Animated Flow — "How it works" */}
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-tonal">
              <p className="text-sm font-bold uppercase tracking-wider text-on-surface-variant/60 mb-5">How it works</p>

              {/* Flow Steps */}
              <div className="space-y-2">
                {FLOW_STEPS.map((step, i) => {
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-5 p-4 rounded-2xl transition-all duration-500 ${
                        isActive ? 'bg-primary/5 scale-[1.03]' : isPast ? 'opacity-70' : 'opacity-40'
                      }`}
                      style={isActive ? { boxShadow: `0 0 30px ${step.color}20` } : {}}
                    >
                      {/* Step indicator */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${
                            isActive ? 'scale-110' : isPast ? 'scale-95' : 'scale-90'
                          }`}
                          style={{ background: isActive ? `${step.color}20` : isPast ? `${step.color}08` : 'transparent' }}
                        >
                          {step.icon}
                        </div>
                        {/* Connector line */}
                        {i < FLOW_STEPS.length - 1 && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-full h-2 w-0.5 bg-outline-variant/20" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-base font-bold transition-all duration-300 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {step.title}
                        </p>
                        <div className={`overflow-hidden transition-all duration-500 ease-out ${isActive ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <p className={`text-sm text-on-surface-variant mt-0.5 transition-transform duration-500 ease-out ${isActive ? 'translate-y-0' : 'translate-y-3'}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>

                      {/* Active indicator */}
                      <div className={`flex-shrink-0 transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: step.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-5 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-[1500ms] ease-linear"
                  style={{ width: `${((activeStep + 1) / FLOW_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`p-4 rounded-2xl bg-surface-container-low/50 text-center transition-all duration-700 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <span className="material-symbols-outlined text-primary text-lg mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  <p className="text-lg font-bold font-manrope text-on-surface">{stat.value}</p>
                  <p className="text-[10px] text-on-surface-variant">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="col-span-1 lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md">
              {/* Mobile brand */}
              <div className="lg:hidden text-center mb-8">
                <h2 className="text-3xl font-manrope font-extrabold text-primary tracking-tighter">BuildBoard</h2>
                <p className="text-sm text-on-surface-variant mt-2">Internal Innovation Portal</p>
              </div>

              {/* Login card */}
              <div className="glass-card rounded-3xl p-10 shadow-tonal-lg">
                <div className="mb-8">
                  <h2 className="text-2xl font-manrope font-bold text-on-surface tracking-tight">Welcome</h2>
                  <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">
                    Sign in with your corporate Google account to start innovating.
                  </p>
                </div>

                {/* What you can do */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: 'lightbulb', text: 'Submit & discover innovation ideas' },
                    { icon: 'handshake', text: 'Bid solo or as a team to build ideas' },
                    { icon: 'emoji_events', text: 'Earn points & redeem real rewards' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/50">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      <span className="text-sm text-on-surface">{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="w-full py-4 bg-surface-container-lowest text-on-surface font-manrope font-bold rounded-full shadow-tonal-md hover:shadow-tonal-lg hover:bg-surface-container-high active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09a7.07 7.07 0 0 1 0-4.17V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77-.01-.54z" fill="#FBBC05" />
                    <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335" />
                  </svg>
                  {busy ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <p className="mt-6 text-center text-xs text-on-surface-variant/60">
                  By signing in, you agree to the innovation program guidelines
                </p>
              </div>

              {/* Points preview */}
              <div className="mt-6 p-4 rounded-2xl bg-surface-container-low/30 text-center">
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-primary">🏆 2,000 pts</span> milestone unlocks real-world rewards
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
