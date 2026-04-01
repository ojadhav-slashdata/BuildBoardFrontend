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
        role: 'Employee', // default role; backend can override later
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">BuildBoard</h1>
        <p className="text-gray-500 mb-8">Innovation Portal — Sign in to continue</p>
        <div className="flex justify-center">
          <button
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="flex items-center gap-3 bg-white border border-gray-300 rounded-full px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09a7.07 7.07 0 0 1 0-4.17V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77-.01-.54z" fill="#FBBC05" />
              <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335" />
            </svg>
            {busy ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
