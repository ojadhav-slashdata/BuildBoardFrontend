import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linksByRole = {
  Employee: [
    { to: '/portal', label: 'Portal', icon: '💡' },
    { to: '/my-bids', label: 'My Bids', icon: '🎯' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ],
  Manager: [
    { to: '/portal', label: 'Portal', icon: '💡' },
    { to: '/approvals', label: 'Approvals', icon: '✅' },
    { to: '/analytics', label: 'Analytics', icon: '📊' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ],
  Admin: [
    { to: '/portal', label: 'Portal', icon: '💡' },
    { to: '/approvals', label: 'Approvals', icon: '✅' },
    { to: '/analytics', label: 'Analytics', icon: '📊' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || linksByRole.Employee;

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-gradient-to-b from-indigo-50 via-white to-violet-50 border-r border-gray-200 min-h-[calc(100vh-45px)]">
      <nav className="flex flex-col gap-0.5 p-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
