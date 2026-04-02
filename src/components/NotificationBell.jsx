import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../axiosConfig';

const TYPE_ICONS = {
  info: 'info', success: 'check_circle', warning: 'warning', error: 'error',
  bid: 'gavel', approval: 'fact_check', assignment: 'emoji_events',
  feedback: 'star', milestone: 'workspace_premium',
};

const TYPE_COLORS = {
  info: 'text-primary', success: 'text-emerald-600', warning: 'text-amber-600',
  error: 'text-red-600', bid: 'text-indigo-600', approval: 'text-green-600',
  assignment: 'text-purple-600', feedback: 'text-amber-600', milestone: 'text-yellow-600',
};

const TYPE_BG = {
  info: 'bg-primary/5', success: 'bg-emerald-50', warning: 'bg-amber-50',
  error: 'bg-red-50', bid: 'bg-indigo-50', approval: 'bg-green-50',
  assignment: 'bg-purple-50', feedback: 'bg-amber-50', milestone: 'bg-yellow-50',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const ref = useRef(null);

  const loadNotifications = useCallback(() => {
    if (!user) return;
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data?.notifications || []);
        setUnreadCount(res.data?.unreadCount || 0);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }, [user]);

  // Initial load + polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const onNotificationClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.idea_id) navigate(`/ideas/${n.idea_id}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-xl hover:bg-surface-container-high/50 transition-colors"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]"
          style={{ fontVariationSettings: open ? "'FILL' 1" : "'FILL' 0" }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-bright rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
              <h3 className="font-manrope font-bold text-sm text-on-surface">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-error text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loadError ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2 block">cloud_off</span>
                <p className="text-sm text-on-surface-variant/60">Could not load notifications</p>
                <button onClick={loadNotifications} className="text-xs text-primary font-medium mt-2 hover:underline">Retry</button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2 block">notifications_off</span>
                <p className="text-sm text-on-surface-variant/60">No notifications yet</p>
                <p className="text-xs text-on-surface-variant/40 mt-1">You'll be notified when something happens</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => onNotificationClick(n)}
                  className={`px-4 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-outline-variant/5 ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl ${TYPE_BG[n.type] || 'bg-primary/5'} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className={`material-symbols-outlined text-lg ${TYPE_COLORS[n.type] || 'text-primary'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {TYPE_ICONS[n.type] || 'info'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold text-on-surface' : 'font-medium text-on-surface-variant'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-on-surface-variant/40 mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-outline-variant/10 text-center">
              <button onClick={() => { setOpen(false); navigate('/notifications'); }} className="text-xs text-primary font-semibold hover:underline">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
