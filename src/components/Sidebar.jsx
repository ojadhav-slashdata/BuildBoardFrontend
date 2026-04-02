import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linksByRole = {
  Employee: [
    { to: '/portal', label: 'Home', icon: 'dashboard' },
    { to: '/ideas/submit', label: 'Submit Idea', icon: 'lightbulb', accent: true },
    { to: '/browse-ideas', label: 'Place a Bid', icon: 'gavel', accent: true },
    { to: '/my-bids', label: 'My Bids', icon: 'assignment' },
    { to: '/projects', label: 'Projects', icon: 'folder_special' },
    { to: '/marketplace', label: 'Rewards', icon: 'redeem' },
    { to: '/guide', label: 'Guide', icon: 'help' },
    { to: '/profile', label: 'Profile', icon: 'person' },
  ],
  Manager: [
    { to: '/portal', label: 'Home', icon: 'dashboard' },
    { to: '/ideas/submit', label: 'Submit Idea', icon: 'lightbulb', accent: true },
    { to: '/browse-ideas', label: 'Place a Bid', icon: 'gavel', accent: true },
    { to: '/bids/dashboard', label: 'Bid Dashboard', icon: 'analytics' },
    { to: '/projects', label: 'Projects', icon: 'folder_special' },
    { to: '/approvals', label: 'Approvals', icon: 'fact_check' },
    { to: '/analytics', label: 'Analytics', icon: 'monitoring' },
    { to: '/executive', label: 'Executive View', icon: 'trending_up' },
    { to: '/marketplace', label: 'Rewards', icon: 'redeem' },
    { to: '/guide', label: 'Guide', icon: 'help' },
    { to: '/profile', label: 'Profile', icon: 'person' },
  ],
  Admin: [
    { to: '/portal', label: 'Home', icon: 'dashboard' },
    { to: '/ideas/submit', label: 'Submit Idea', icon: 'lightbulb', accent: true },
    { to: '/browse-ideas', label: 'Place a Bid', icon: 'gavel', accent: true },
    { to: '/bids/dashboard', label: 'Bid Dashboard', icon: 'analytics' },
    { to: '/projects', label: 'Projects', icon: 'folder_special' },
    { to: '/approvals', label: 'Approvals', icon: 'fact_check' },
    { to: '/analytics', label: 'Analytics', icon: 'monitoring' },
    { to: '/executive', label: 'Executive View', icon: 'trending_up' },
    { to: '/admin/users', label: 'Users', icon: 'group' },
    { to: '/marketplace', label: 'Rewards', icon: 'redeem' },
    { to: '/guide', label: 'Guide', icon: 'help' },
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
              l.accent
                ? `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:translate-x-0.5 ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-tonal-md'
                      : 'bg-primary/10 text-primary hover:bg-primary/15'
                  }`
                : `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 ${
                    isActive
                      ? 'bg-surface-container-lowest text-primary shadow-tonal font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-high/50'
                  }`
            }
          >
            <span className="material-symbols-outlined text-[20px]" style={l.accent ? { fontVariationSettings: "'FILL' 1" } : {}}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
