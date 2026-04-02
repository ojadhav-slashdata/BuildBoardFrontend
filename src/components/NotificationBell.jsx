import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const fetch = () => {
    api.get('/notifications')
      .then(r => {
        setNotifications(r.data.notifications || []);
        setUnreadCount(r.data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.idea_id) navigate(`/ideas/${n.idea_id}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-surface-container-high/50 transition-colors">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: open ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-bright rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="font-manrope font-bold text-sm text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">Mark all read</button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2 block">notifications_off</span>
                <p className="text-sm text-on-surface-variant/60">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-outline-variant/5 ${!n.is_read ? 'bg-primary/3' : ''}`}>
                  <span className={`material-symbols-outlined text-lg mt-0.5 ${TYPE_COLORS[n.type] || 'text-primary'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {TYPE_ICONS[n.type] || 'info'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-on-surface-variant/40 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
