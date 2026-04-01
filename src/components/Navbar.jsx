import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linksByRole = {
  Employee: [
    { to: '/portal', label: 'Portal' },
    { to: '/my-bids', label: 'My Bids' },
    { to: '/profile', label: 'Profile' },
  ],
  Manager: [
    { to: '/portal', label: 'Portal' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/analytics', label: 'Analytics' },
  ],
  Admin: [
    { to: '/portal', label: 'Portal' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/admin/users', label: 'Users' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = linksByRole[user?.role] || linksByRole.Employee;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold text-indigo-600">BuildBoard</span>
        <div className="hidden md:flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <img
              src={user.pictureUrl}
              alt={user.name}
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
          </>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
