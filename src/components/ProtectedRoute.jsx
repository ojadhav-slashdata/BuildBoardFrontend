import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/portal" replace />;

  return children;
}
