import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const redirectByRole = {
  Employee: '/portal',
  Manager: '/approvals',
  Admin: '/analytics',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container-low" />
        <div className="absolute inset-0 tech-pattern" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-24">
          {/* Left: Editorial Branding */}
          <div className="hidden lg:flex flex-col col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex px-4 py-1.5 rounded-full bg-surface-container-high text-primary font-inter text-xs font-semibold tracking-wider uppercase">
                The Innovation Portal
              </span>
              <h1 className="text-6xl font-manrope font-extrabold tracking-tighter text-on-background leading-[1.1]">
                Build<span className="text-primary">Board</span>.
              </h1>
              <p className="text-xl text-on-surface-variant leading-relaxed max-w-md">
                The definitive hub for engineering intelligence, architectural synergy, and breakthrough development.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-surface-container-low/50">
                <div className="text-primary-container mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>rocket_launch</span>
                </div>
                <h3 className="font-manrope font-bold text-on-surface text-lg">Scalability</h3>
                <p className="text-sm text-on-surface-variant">Engineered for growth from day zero.</p>
              </div>
              <div className="p-6 rounded-2xl bg-surface-container-low/50">
                <div className="text-primary-container mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>monitoring</span>
                </div>
                <h3 className="font-manrope font-bold text-on-surface text-lg">Insights</h3>
                <p className="text-sm text-on-surface-variant">Real-time telemetry for projects.</p>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="col-span-1 lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md glass-card rounded-2xl p-10 shadow-tonal-lg">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center mb-8">
                <h2 className="text-3xl font-manrope font-extrabold text-primary tracking-tighter">BuildBoard</h2>
              </div>

              <div className="mb-10">
                <h2 className="text-3xl font-manrope font-bold text-on-surface tracking-tight">Welcome back</h2>
                <p className="text-on-surface-variant mt-2">Enter your credentials to access the portal.</p>
                <p className="text-on-surface-variant mt-4 text-sm leading-relaxed">Sign in with your corporate Google account to access the portal.</p>
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

              <div className="mt-10 text-center">
                <p className="text-on-surface-variant text-sm">
                  Don&apos;t have an account?{' '}
                  <span className="text-primary font-bold">Request Access</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
