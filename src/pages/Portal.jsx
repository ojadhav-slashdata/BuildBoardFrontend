import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../axiosConfig';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Tech', 'HR', 'Finance', 'Operations', 'Other'];
const STATUSES   = ['All', 'BiddingOpen', 'InProgress', 'PendingApproval', 'Completed'];

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_STYLES = {
  BiddingOpen:     'bg-green-50 text-green-700 ring-green-600/20',
  InProgress:      'bg-amber-50 text-amber-700 ring-amber-600/20',
  PendingApproval: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Completed:       'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rejected:        'bg-red-50 text-red-700 ring-red-600/20',
  Draft:           'bg-surface-container-low text-on-surface-variant ring-on-surface-variant/20',
  BiddingClosed:   'bg-slate-50 text-slate-600 ring-slate-500/20',
  Assigned:        'bg-purple-50 text-purple-700 ring-purple-600/20',
};

const STATUS_LABELS = {
  BiddingOpen:     'Open for Bidding',
  InProgress:      'In Progress',
  PendingApproval: 'Pending Review',
  Completed:       'Completed',
  Rejected:        'Rejected',
  Draft:           'Draft',
  BiddingClosed:   'Bidding Closed',
  Assigned:        'Assigned',
};

// ─── Recent activity (placeholder) ───────────────────────────────────────────

const RECENT_ACTIVITY = [
  { id: 1, icon: '💡', text: 'New idea submitted', sub: 'AI-powered onboarding flow', time: '2 min ago', color: 'bg-primary' },
  { id: 2, icon: '🏆', text: 'Bid accepted', sub: 'Data pipeline automation', time: '1 hr ago', color: 'bg-secondary' },
  { id: 3, icon: '✅', text: 'Project completed', sub: 'HR self-service portal', time: '3 hr ago', color: 'bg-emerald-500' },
  { id: 4, icon: '📋', text: 'Idea approved for bidding', sub: 'Finance dashboard revamp', time: '5 hr ago', color: 'bg-primary' },
  { id: 5, icon: '🔍', text: 'Pending review', sub: 'Operations routing tool', time: 'Yesterday', color: 'bg-tertiary' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, materialIcon, accent, badge, onClick }) {
  return (
    <div onClick={onClick} className="bg-surface-container-lowest p-6 rounded-2xl hover:shadow-tonal-md transition-all duration-200 group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${accent.bg} ${accent.iconColor || accent.text}`}>
          <span className="material-symbols-outlined">{materialIcon}</span>
        </div>
        {badge && (
          <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-full">{badge}</span>
        )}
      </div>
      <p className="text-sm font-medium text-on-surface-variant mb-1">{label}</p>
      <h3 className="text-3xl font-bold font-manrope tracking-tight text-on-surface">{value}</h3>
      <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
        <div className={`h-full ${accent.bar || 'bg-primary'} rounded-full`} style={{ width: `${Math.min(100, Math.max(10, value * 5))}%` }} />
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-surface-container-low text-on-surface-variant ring-on-surface-variant/20';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

function IdeaCard({ idea, currentUserId, onNavigate }) {
  const isOwner     = idea.submittedBy?._id === currentUserId || idea.submittedBy === currentUserId;
  const isAssignee  = idea.assignedTo?._id === currentUserId  || idea.assignedTo  === currentUserId;
  const ownerName   = idea.submittedBy?.name ?? idea.submittedBy ?? 'Unknown';

  function ActionButton() {
    if (idea.status === 'BiddingOpen') {
      return (
        <button
          onClick={() => onNavigate(`/ideas/${idea._id}/bid`)}
          className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-2 text-xs font-semibold text-white shadow-tonal hover:shadow-tonal-md transition-all duration-200"
        >
          Place bid
        </button>
      );
    }
    if (isAssignee && idea.status === 'InProgress') {
      return (
        <button
          onClick={() => onNavigate(`/ideas/${idea._id}`)}
          className="shrink-0 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
        >
          View project
        </button>
      );
    }
    return (
      <button
        onClick={() => onNavigate(`/ideas/${idea._id}`)}
        className="shrink-0 rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
      >
        {isOwner ? 'View' : 'Details'}
      </button>
    );
  }

  return (
    <article className="bg-surface-container-lowest p-6 rounded-2xl hover:shadow-tonal-md transition-all duration-200 group">
      <div className="space-y-3">
        {/* Tags + Status */}
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap gap-2">
            {idea.category && (
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full uppercase tracking-wider">{idea.category}</span>
            )}
            {idea.projectType && (
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full uppercase tracking-wider">{idea.projectType}</span>
            )}
          </div>
          <StatusBadgeInline status={idea.status} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold font-manrope text-on-surface group-hover:text-primary transition-colors">{idea.title}</h3>

        {/* Description */}
        {idea.description && (
          <p className="text-on-surface-variant text-sm line-clamp-2 leading-relaxed">{idea.description}</p>
        )}

        {/* Footer: owner + action */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {(ownerName || '?')[0]}
            </div>
            <span className="text-xs font-medium text-on-surface-variant">Owned by {ownerName}</span>
            {idea.bidCount != null && (
              <span className="text-xs text-on-surface-variant/60 ml-2">{idea.bidCount} bid{idea.bidCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(`/ideas/${idea._id}`)}
              className="px-4 py-2 text-primary font-bold text-sm hover:bg-primary/5 rounded-full transition-colors"
            >
              Details
            </button>
            <ActionButton />
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Portal() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [overview,     setOverview]     = useState(null);
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [ideas,        setIdeas]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filters,      setFilters]      = useState({ search: '', category: 'All', status: 'All' });

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/dashboard'),
      api.get('/ideas'),
    ])
      .then(([overviewRes, dashRes, ideasRes]) => {
        setOverview(overviewRes.data);
        setLeaderboard(dashRes.data?.leaderboard ?? []);
        setIdeas(ideasRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Filter ideas ────────────────────────────────────────────────────────────
  const isEmployee = user?.role === 'Employee';
  const filtered = ideas.filter((idea) => {
    if (isEmployee) {
      const isOpenForBidding = idea.status === 'BiddingOpen';
      const isMyIdea =
        idea.submittedBy === user?.id || idea.submittedBy?._id === user?.id ||
        idea.assignedTo === user?.id || idea.assignedTo?._id === user?.id ||
        idea.projectOwner === user?.name || idea.projectOwner === user?.email ||
        idea.teamMembers?.some((m) => m.id === user?.id || m.userId === user?.id);
      // Employees see: all BiddingOpen + their own InProgress/Completed/PendingApproval
      if (!isOpenForBidding && !isMyIdea) return false;
    }
    if (filters.search && !idea.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category !== 'All' && idea.category !== filters.category) return false;
    if (filters.status !== 'All' && idea.status !== filters.status) return false;
    return true;
  });

  // ── Stat cards config ───────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Open for Bidding', value: overview?.biddingOpen ?? 0,
      materialIcon: 'bid_landscape', badge: 'Active',
      accent: { bg: 'bg-primary/5', text: 'text-primary', iconColor: 'text-primary', bar: 'bg-primary' },
      onClick: () => setFilters(f => ({ ...f, status: 'BiddingOpen' })),
    },
    {
      label: 'In Progress', value: overview?.inProgress ?? 0,
      materialIcon: 'manufacturing',
      accent: { bg: 'bg-secondary/5', text: 'text-secondary', iconColor: 'text-secondary', bar: 'bg-secondary' },
      onClick: () => setFilters(f => ({ ...f, status: 'InProgress' })),
    },
    {
      label: 'Pending Review', value: overview?.openIdeas ?? 0,
      materialIcon: 'rate_review',
      accent: { bg: 'bg-tertiary/5', text: 'text-tertiary', iconColor: 'text-tertiary', bar: 'bg-tertiary' },
      onClick: () => setFilters(f => ({ ...f, status: 'PendingApproval' })),
    },
    {
      label: 'Completed', value: overview?.completed ?? 0,
      materialIcon: 'verified',
      accent: { bg: 'bg-emerald-500/5', text: 'text-emerald-600', iconColor: 'text-emerald-600', bar: 'bg-emerald-500' },
      onClick: () => setFilters(f => ({ ...f, status: 'Completed' })),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Innovation Portal</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Browse, submit, and build ideas that move the company forward.</p>
        </div>
        <Link
          to="/ideas/submit"
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Submit idea
        </Link>
      </div>

      {/* ── Hero Stats Bento Grid ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      {/* ── Search and Filter Bar ───────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-xl">
        <div className="flex-grow relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search ideas, builders, or tags..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg font-inter text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="flex items-center gap-2 px-4 py-3 bg-surface-container-lowest text-on-surface font-medium rounded-lg hover:bg-surface-container-high transition-colors text-sm outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="flex items-center gap-2 px-4 py-3 bg-surface-container-lowest text-on-surface font-medium rounded-lg hover:bg-surface-container-high transition-colors text-sm outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All statuses' : STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── Main Layout: 2/3 Ideas + 1/3 Sidebar ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

        {/* Left Column: Active Ideas */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Active Ideas</h2>
            <span className="text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{filtered.length}</span> idea{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">search</span>
              <p className="text-sm font-medium text-on-surface-variant">No ideas match your filters.</p>
              <button
                onClick={() => setFilters({ search: '', category: 'All', status: 'All' })}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((idea) => (
                <IdeaCard
                  key={idea._id}
                  idea={idea}
                  currentUserId={user?.id}
                  onNavigate={navigate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Feed */}
        <div className="space-y-8">

          {/* Top Builders Leaderboard */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              Top Builders
            </h2>
            <ul className="space-y-3">
              {leaderboard.length === 0 ? (
                <li className="py-8 text-center text-sm text-on-surface-variant/60">No data yet.</li>
              ) : (
                leaderboard.slice(0, 5).map((entry, i) => (
                  <li key={entry.name ?? i} className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-2xl hover:translate-x-0.5 transition-transform">
                    <span className="w-6 text-center font-bold text-primary italic">
                      {['🥇', '🥈', '🥉'][i] ?? (i + 1)}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(entry.name ?? '?')[0]}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{entry.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary">{entry.points}</p>
                      <p className="text-[10px] text-on-surface-variant">pts</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            {(user?.role === 'Manager' || user?.role === 'Admin') && (
              <Link to="/analytics" className="block w-full mt-6 py-3 text-center text-on-surface-variant text-sm font-bold rounded-xl hover:bg-surface-container-high transition-colors">
                Full Leaderboard →
              </Link>
            )}
          </div>

          {/* Live Activity */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold font-manrope px-2">Live Activity</h2>
            <div className="relative space-y-6 pl-4 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
              {RECENT_ACTIVITY.map((item) => (
                <div key={item.id} className="relative flex gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color} mt-2 ring-4 ring-surface shadow-sm z-10 shrink-0`} />
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-tonal flex-grow">
                    <p className="text-xs text-on-surface-variant/60 mb-1">{item.time}</p>
                    <p className="text-sm text-on-surface">
                      <span className="font-bold">{item.text}</span>
                      {' — '}
                      <span className="text-primary font-medium">{item.sub}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
