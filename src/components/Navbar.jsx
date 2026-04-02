import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationBell from './NotificationBell';

const MILESTONES = [2000, 4000, 6000, 8000, 10000];

function getMilestone(points) {
  const next = MILESTONES.find((m) => points < m) || MILESTONES[MILESTONES.length - 1];
  const prev = MILESTONES[MILESTONES.indexOf(next) - 1] || 0;
  return { next, prev, progress: Math.min(100, ((points - prev) / (next - prev)) * 100) };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const points = user?.totalPoints || 0;
  const milestone = getMilestone(points);

  return (
    <nav className="h-16 px-8 flex items-center justify-between sticky top-0 z-40 bg-slate-50/70 backdrop-blur-xl shadow-xl shadow-sky-900/5">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input type="text" placeholder="Search projects..." className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Role badge (read-only) */}
        {user && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {user.role}
          </span>
        )}

        {/* Notification Bell */}
        {user && <NotificationBell />}

        {/* Account dropdown */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 bg-surface-container-low rounded-full pl-1 pr-3 py-1 hover:bg-surface-container-high transition-colors"
            >
              {user.pictureUrl ? (
                <img src={user.pictureUrl} alt={user.name} className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{(user.name || '?')[0]}</span>
              )}
              <span className="text-sm font-medium text-on-surface hidden sm:block">{user.name}</span>
              {points > 0 && (
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full hidden sm:inline">{points} pts</span>
              )}
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container-lowest rounded-2xl shadow-tonal-lg z-50 overflow-hidden">
                {/* User info */}
                <div className="p-4 border-b border-surface-container-high">
                  <p className="text-sm font-bold text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{user.role}</span>
                </div>

                {/* Milestone progress */}
                <div className="p-4 border-b border-surface-container-high">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-on-surface-variant">Milestone Progress</span>
                    <span className="text-xs font-bold text-primary">{points} / {milestone.next}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    {milestone.next - points} pts to next milestone
                  </p>
                </div>

                {/* Links */}
                <div className="p-2">
                  <button
                    onClick={() => { setShowMenu(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Profile
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/guide'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    Guide
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-container/50 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
