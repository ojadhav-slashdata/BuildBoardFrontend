import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const redirectByRole = { Employee: '/portal', Manager: '/portal', Admin: '/portal' };

const FLOW_STEPS = [
  { icon: '💡', title: 'Submit Ideas', desc: 'Anyone can propose innovation ideas', color: '#006592' },
  { icon: '✅', title: 'Admin Approves', desc: 'Sets size, complexity & bidding window', color: '#10b981' },
  { icon: '🏗️', title: 'Teams Bid & Build', desc: 'Solo or team bids ranked by performance', color: '#34b5fa' },
  { icon: '⏱️', title: 'Track Progress', desc: 'Kanban boards, chat & daily hour logs', color: '#f59e0b' },
  { icon: '⭐', title: 'Get Rated', desc: 'Admin rates delivery quality', color: '#8b5cf6' },
  { icon: '🏆', title: 'Earn Rewards', desc: 'Points → real marketplace rewards', color: '#ec4899' },
];

const STATS_DATA = [
  { label: 'Ideas Shipped', end: 150, suffix: '+', icon: 'rocket_launch' },
  { label: 'Innovation Hours', end: 2400, suffix: '+', icon: 'schedule' },
  { label: 'Points Awarded', end: 45, suffix: 'K+', icon: 'stars' },
  { label: 'Team Members', end: 80, suffix: '+', icon: 'group' },
];

// Counting animation hook
function useCountUp(end, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, end, duration]);
  return value;
}

function AnimatedStat({ stat, delay, animate }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const count = useCountUp(stat.end, 1800, show && animate);

  return (
    <div className={`text-center transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <span className="material-symbols-outlined text-primary/70 text-xl mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
      <p className="text-3xl lg:text-4xl font-black font-headline text-on-background tracking-tight">{count}{stat.suffix}</p>
      <p className="text-xs text-on-surface-variant mt-1 font-medium">{stat.label}</p>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Staggered entry states
  const [showBrand, setShowBrand] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // Returning user detection
  const [returningUser, setReturningUser] = useState(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bb_user');
      if (saved) setReturningUser(JSON.parse(saved));
    } catch {}
  }, []);

  // Staggered entrance animation
  useEffect(() => {
    setTimeout(() => setShowBrand(true), 100);
    setTimeout(() => setShowTagline(true), 400);
    setTimeout(() => setShowStats(true), 700);
    setTimeout(() => setShowFlow(true), 1000);
    setTimeout(() => setShowCard(true), 300);
  }, []);

  // Auto-advance flow steps
  useEffect(() => {
    if (!showFlow) return;
    const timer = setInterval(() => setActiveStep(p => (p + 1) % FLOW_STEPS.length), 1800);
    return () => clearInterval(timer);
  }, [showFlow]);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const firebaseUser = result.user;
      const userData = {
        id: firebaseUser.uid, email: firebaseUser.email,
        name: firebaseUser.displayName, pictureUrl: firebaseUser.photoURL, role: 'Employee',
      };
      // Save for returning user detection
      localStorage.setItem('bb_user', JSON.stringify({ name: userData.name, pictureUrl: userData.pictureUrl }));
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
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-container-low to-surface-container" />
        <div className="absolute inset-0 tech-pattern" />
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-primary/4 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] bg-primary-container/4 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col lg:flex-row items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[1300px] grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-20">

          {/* ===== RIGHT: Login Card (FIRST on mobile) ===== */}
          <div className={`col-span-1 lg:col-span-5 lg:order-2 flex justify-center transition-all duration-700 ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-full max-w-md">
              {/* Mobile brand */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-white text-2xl">tactic</span>
                </div>
                <h2 className="text-3xl font-headline font-black text-on-background tracking-tight">Build<span className="text-primary">Board</span></h2>
                <p className="text-sm text-on-surface-variant mt-1">Innovation Portal</p>
              </div>

              {/* Login card */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 editorial-shadow">
                <div className="mb-8">
                  {returningUser ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        {returningUser.pictureUrl && <img src={returningUser.pictureUrl} className="w-12 h-12 rounded-full" alt="" referrerPolicy="no-referrer" />}
                        <div>
                          <p className="text-sm text-on-surface-variant">Welcome back</p>
                          <h2 className="text-2xl font-headline font-black text-on-background tracking-tight">{returningUser.name?.split(' ')[0]} 👋</h2>
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">Pick up where you left off — your ideas and bids are waiting.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-headline font-black text-on-background tracking-tight mb-2">Get Started</h2>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        Sign in with your corporate Google account to start building.
                      </p>
                    </>
                  )}
                </div>

                {/* Feature pills */}
                <div className="space-y-2.5 mb-8">
                  {[
                    { icon: 'lightbulb', text: 'Submit & discover innovation ideas' },
                    { icon: 'handshake', text: 'Bid solo or as a team to build' },
                    { icon: 'emoji_events', text: 'Earn points & redeem real rewards' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      <span className="text-sm text-on-surface font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="w-full py-4 bg-white text-on-surface font-headline font-bold rounded-2xl shadow-tonal-md hover:shadow-tonal-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 border border-slate-200/50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09a7.07 7.07 0 0 1 0-4.17V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77-.01-.54z" fill="#FBBC05" />
                    <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335" />
                  </svg>
                  {busy ? 'Signing in...' : returningUser ? 'Continue with Google' : 'Sign in with Google'}
                </button>

                <p className="mt-5 text-center text-xs text-on-surface-variant/50">
                  By signing in, you agree to the innovation program guidelines
                </p>
              </div>
            </div>
          </div>

          {/* ===== LEFT: Brand + Stats + Flow (SECOND on mobile) ===== */}
          <div className="hidden lg:flex flex-col col-span-7 lg:order-1 space-y-10">

            {/* Brand + Hero tagline */}
            <div>
              <div className={`transition-all duration-700 ${showBrand ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">tactic</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">Innovation Portal</span>
                </div>
                <h1 className="text-6xl xl:text-7xl font-headline font-black tracking-tighter text-on-background leading-[0.95] mb-0">
                  Build<span className="text-primary">Board</span>
                </h1>
              </div>

              <div className={`mt-6 transition-all duration-700 delay-200 ${showTagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <p className="text-2xl xl:text-3xl font-headline font-bold text-on-background/80 leading-snug max-w-lg">
                  Your ideas. Built by your team. <span className="text-primary">Rewarded.</span>
                </p>
                <p className="text-base text-on-surface-variant mt-3 max-w-md leading-relaxed">
                  The platform where employees submit innovation ideas, teams compete to build them, and everyone earns real rewards.
                </p>
              </div>
            </div>

            {/* Stats — Above the fold, big and animated */}
            <div className={`grid grid-cols-4 gap-6 py-6 px-2 transition-all duration-500 ${showStats ? 'opacity-100' : 'opacity-0'}`}>
              {STATS_DATA.map((stat, i) => (
                <AnimatedStat key={stat.label} stat={stat} delay={800 + i * 200} animate={showStats} />
              ))}
            </div>

            {/* How it works — animated flow */}
            <div className={`bg-white/60 backdrop-blur-xl rounded-3xl p-6 editorial-shadow transition-all duration-700 ${showFlow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">How it works</p>
                <div className="flex gap-1">
                  {FLOW_STEPS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeStep ? 'bg-primary w-4' : i < activeStep ? 'bg-primary/30' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                {FLOW_STEPS.map((step, i) => {
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  return (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-primary/5 scale-[1.02]' : isPast ? 'opacity-60' : 'opacity-30'}`}
                      style={isActive ? { boxShadow: `0 0 25px ${step.color}15` } : {}}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-500 ${isActive ? 'scale-110' : 'scale-90'}`}
                        style={{ background: isActive ? `${step.color}15` : 'transparent' }}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-sm font-bold transition-colors duration-300 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{step.title}</p>
                        <div className={`overflow-hidden transition-all duration-500 ease-out ${isActive ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <p className={`text-xs text-on-surface-variant mt-0.5 transition-transform duration-500 ${isActive ? 'translate-y-0' : 'translate-y-2'}`}>{step.desc}</p>
                        </div>
                      </div>
                      <div className={`transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: step.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-[1800ms] ease-linear"
                  style={{ width: `${((activeStep + 1) / FLOW_STEPS.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom stats */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 py-3 px-4 z-20">
        <div className="grid grid-cols-4 gap-2">
          {STATS_DATA.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-black font-headline text-on-background">{stat.end}{stat.suffix}</p>
              <p className="text-[9px] text-on-surface-variant">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
