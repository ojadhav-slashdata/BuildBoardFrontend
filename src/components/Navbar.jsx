import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">BuildBoard</span>
        <span className="hidden sm:block text-xs text-gray-400 border-l border-gray-200 pl-3">Innovation Portal</span>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5 bg-gray-50 rounded-full pl-1 pr-3 py-1">
            {user.pictureUrl ? (
              <img src={user.pictureUrl} alt={user.name} className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{(user.name || '?')[0]}</span>
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
            <span className="text-xs text-gray-400 hidden sm:block">({user.role})</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
