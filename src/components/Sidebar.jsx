import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linksByRole = {
  Employee: [
    { to: '/portal', label: 'Portal', icon: 'dashboard' },
    { to: '/my-bids', label: 'My Bids', icon: 'gavel' },
    { to: '/profile', label: 'Profile', icon: 'person' },
  ],
  Manager: [
    { to: '/portal', label: 'Portal', icon: 'dashboard' },
    { to: '/approvals', label: 'Approvals', icon: 'fact_check' },
    { to: '/analytics', label: 'Analytics', icon: 'monitoring' },
    { to: '/profile', label: 'Profile', icon: 'person' },
  ],
  Admin: [
    { to: '/portal', label: 'Portal', icon: 'dashboard' },
    { to: '/approvals', label: 'Approvals', icon: 'fact_check' },
    { to: '/analytics', label: 'Analytics', icon: 'monitoring' },
    { to: '/admin/users', label: 'Users', icon: 'group' },
    { to: '/profile', label: 'Profile', icon: 'person' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || linksByRole.Employee;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-container-low min-h-[calc(100vh-57px)]">
      <div className="px-6 py-6 mb-2">
        <h2 className="font-manrope font-extrabold text-on-surface text-lg">Project Portal</h2>
        <p className="text-xs text-on-surface-variant/60 font-medium">Innovation Submission</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 ${
                isActive
                  ? 'bg-surface-container-lowest text-primary shadow-tonal font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high/50'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
