import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">lock</span>
        <h2 className="text-lg font-bold font-manrope text-on-surface mb-2">Access Restricted</h2>
        <p className="text-sm text-on-surface-variant mb-4">This page requires {roles.join(' or ')} access.</p>
        <p className="text-xs text-on-surface-variant/60 mb-6">Your current role: <strong>{user?.role || 'Unknown'}</strong></p>
        <a href="/portal" className="btn-primary px-6 py-2.5 text-sm">Back to Home</a>
      </div>
    );
  }

  return children;
}
