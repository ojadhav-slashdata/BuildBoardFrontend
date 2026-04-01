import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const devRoles = ['Employee', 'Manager', 'Admin'];

export default function Navbar() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-nav px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-manrope font-extrabold tracking-tighter text-on-background">Build<span className="text-primary">Board</span></span>
        <span className="hidden sm:block text-xs text-on-surface-variant/60 pl-3 ml-3">Innovation Portal</span>
      </div>

      {/* DEV Role Switcher */}
      {user && (
        <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-2 py-1">
          <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider px-1">Dev</span>
          <div className="inline-flex bg-surface-container-high rounded-full p-0.5">
            {devRoles.map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  user.role === role
                    ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5 bg-surface-container-low rounded-full pl-1 pr-3 py-1">
            {user.pictureUrl ? (
              <img src={user.pictureUrl} alt={user.name} className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{(user.name || '?')[0]}</span>
            )}
            <span className="text-sm font-medium text-on-surface hidden sm:block">{user.name}</span>
            <span className="text-xs text-on-surface-variant/60 hidden sm:block">({user.role})</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-on-surface-variant hover:text-error px-2 py-1.5 rounded-full hover:bg-error-container/50 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
