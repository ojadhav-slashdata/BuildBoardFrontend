import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeSwitcher from './ThemeSwitcher';
import api from '../axiosConfig';

const devRoles = ['Employee', 'Manager', 'Admin'];

const MILESTONES = [2000, 4000, 6000, 8000, 10000];

function getMilestone(points) {
  const next = MILESTONES.find((m) => points < m) || MILESTONES[MILESTONES.length - 1];
  const prev = MILESTONES[MILESTONES.indexOf(next) - 1] || 0;
  return { next, prev, progress: Math.min(100, ((points - prev) / (next - prev)) * 100) };
}

export default function Navbar() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
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

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const newNotifs = res.data || [];
        setNotifications(newNotifs);
        if (!showNotifDropdown) {
          setUnreadCount(newNotifs.length);
        }
      } catch (err) {
        // silently fail
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const notifIcon = (type) => {
    if (type === 'bid') return 'gavel';
    if (type === 'comment') return 'chat_bubble';
    return 'lightbulb';
  };

  return (
    <nav className="glass-nav px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-2xl font-manrope font-extrabold tracking-tighter text-on-background hover:opacity-80 transition">Build<span className="text-primary">Board</span></Link>
        <span className="hidden sm:block text-xs text-on-surface-variant/60 pl-3 ml-3">Innovation Portal</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Role Switcher */}
        {user && (
          <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-2 py-1">
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

        {/* Notification Bell */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifDropdown(!showNotifDropdown); setUnreadCount(0); }}
              className="relative p-2 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-surface-container-high">
                  <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-on-surface-variant/60">No notifications yet</div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-surface-container-low border-b border-surface-container-high/50 last:border-0 cursor-pointer" onClick={() => { navigate(`/ideas/${notif.ideaId}`); setShowNotifDropdown(false); }}>
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">{notifIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-on-surface line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-on-surface-variant/60 mt-1">{timeAgo(notif.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
