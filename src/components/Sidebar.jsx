import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import firstechLogo from '../assets/firstech-logo.png';

const ROUTE_MAPPINGS = {
  '/ideas/submit': '/ideas/submit',
  '/browse-ideas': '/browse-ideas',
  '/ideas': '/all-ideas',
};

const sectionsByRole = {
  Employee: {
    MENU: [
      { to: '/portal', label: 'Home', icon: 'dashboard' },
      { to: '/all-ideas', label: 'All Ideas', icon: 'explore' },
      { to: '/ideas/submit', label: 'Submit Idea', icon: 'lightbulb', accent: true },
      { to: '/browse-ideas', label: 'Place a Bid', icon: 'gavel', accent: true },
      { to: '/my-bids', label: 'My Bids', icon: 'assignment' },
      { to: '/projects', label: 'Projects', icon: 'folder_special' },
    ],
    REQUESTS: [],
    DASHBOARDS: [],
  },
  Manager: {
    MENU: [
      { to: '/portal', label: 'Home', icon: 'dashboard' },
      { to: '/all-ideas', label: 'All Ideas', icon: 'explore' },
      { to: '/ideas/submit', label: 'Submit Idea', icon: 'lightbulb', accent: true },
      { to: '/browse-ideas', label: 'Place a Bid', icon: 'gavel', accent: true },
      { to: '/my-bids', label: 'My Bids', icon: 'assignment' },
      { to: '/projects', label: 'Projects', icon: 'folder_special' },
    ],
    REQUESTS: [],
    DASHBOARDS: [],
  },
  Admin: {
    MENU: [
      { to: '/portal', label: 'Home', icon: 'dashboard' },
      { to: '/all-ideas', label: 'All Ideas', icon: 'explore' },
      { to: '/ideas/submit', label: 'Submit Idea', icon: 'lightbulb', accent: true },
      { to: '/browse-ideas', label: 'Place a Bid', icon: 'gavel', accent: true },
      { to: '/my-bids', label: 'My Bids', icon: 'assignment' },
      { to: '/projects', label: 'Projects', icon: 'folder_special' },
    ],
    REQUESTS: [
      { to: '/approvals', label: 'Approvals', icon: 'fact_check' },
    ],
    DASHBOARDS: [
      { to: '/bids/dashboard', label: 'Bid Dashboard', icon: 'analytics' },
      { to: '/analytics', label: 'Analytics', icon: 'monitoring' },
      { to: '/executive', label: 'Executive View', icon: 'trending_up' },
    ],
  },
};

function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest px-4 pt-5 pb-2">{children}</p>
  );
}

function isRouteActive(to, pathname) {
  if (pathname === to) return true;
  // Sub-route highlighting
  if (to === '/all-ideas' && pathname.startsWith('/ideas/') && !pathname.includes('/submit') && !pathname.includes('/bid') && !pathname.includes('/feedback') && !pathname.includes('/results')) {
    return true;
  }
  if (to === '/projects' && pathname.startsWith('/projects/')) return true;
  return false;
}

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const sections = sectionsByRole[user?.role] || sectionsByRole.Employee;
  const isAdmin = user?.role === 'Admin';

  const renderLink = (l) => {
    const active = isRouteActive(l.to, location.pathname);

    if (l.accent) {
      return (
        <NavLink
          key={l.to}
          to={l.to}
          className={`sidebar-accent-link ${active ? 'sidebar-accent-active' : ''}`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{l.icon}</span>
          {l.label}
        </NavLink>
      );
    }

    return (
      <NavLink
        key={l.to}
        to={l.to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${
          active
            ? 'bg-white text-sky-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{l.icon}</span>
        {l.label}
      </NavLink>
    );
  };

  return (
    <aside className="hidden lg:block w-64 bg-slate-100/50 backdrop-blur-xl min-h-[calc(100vh-64px)] border-r-0">
      <div className="sticky top-16 flex flex-col h-[calc(100vh-64px)]">
      <nav className="flex-1 px-4 pt-4 space-y-0.5 overflow-y-auto">
        {/* MENU section */}
        <SectionTitle>Menu</SectionTitle>
        {sections.MENU.map(renderLink)}

        {/* REQUESTS section */}
        {sections.REQUESTS.length > 0 && (
          <>
            <SectionTitle>Requests</SectionTitle>
            {sections.REQUESTS.map(renderLink)}
          </>
        )}

        {/* DASHBOARDS section */}
        {sections.DASHBOARDS.length > 0 && (
          <>
            <SectionTitle>Dashboards</SectionTitle>
            {sections.DASHBOARDS.map(renderLink)}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-4 pb-4 space-y-1">
        {isAdmin && (
          <>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 ${
                  isActive
                    ? 'bg-surface-container-lowest font-semibold shadow-tonal'
                    : 'text-on-surface-variant hover:bg-surface-container-high/50'
                }`
              }
              style={({ isActive }) => isActive ? { color: 'var(--c-primary, #3525cd)' } : {}}
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              Users
            </NavLink>
            <NavLink
              to="/admin/department-leads"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 ${
                  isActive
                    ? 'bg-surface-container-lowest font-semibold shadow-tonal'
                    : 'text-on-surface-variant hover:bg-surface-container-high/50'
                }`
              }
              style={({ isActive }) => isActive ? { color: 'var(--c-primary, #3525cd)' } : {}}
            >
              <span className="material-symbols-outlined text-[20px]">supervisor_account</span>
              Dept Leads
            </NavLink>
          </>
        )}
        <NavLink
          to="/marketplace"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5 ${
              isActive
                ? 'bg-surface-container-lowest font-semibold shadow-tonal'
                : 'text-on-surface-variant hover:bg-surface-container-high/50'
            }`
          }
          style={({ isActive }) => isActive ? { color: 'var(--c-primary, #3525cd)' } : {}}
        >
          <span className="material-symbols-outlined text-[20px]">redeem</span>
          Rewards
        </NavLink>

        {/* FirsTech Logo */}
        <div className="pt-4 pb-2 flex justify-center opacity-60 hover:opacity-100 transition-opacity">
          <img src={firstechLogo} alt="FirsTech" className="h-8 object-contain" />
        </div>
      </div>
      </div>
    </aside>
  );
}
