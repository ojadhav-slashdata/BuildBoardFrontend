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

// ─── Recent activity (hardcoded placeholder) ──────────────────────────────────

const RECENT_ACTIVITY = [
  { id: 1, icon: '💡', text: 'New idea submitted', sub: 'AI-powered onboarding flow', time: '2 min ago' },
  { id: 2, icon: '🏆', text: 'Bid accepted', sub: 'Data pipeline automation', time: '1 hr ago' },
  { id: 3, icon: '✅', text: 'Project completed', sub: 'HR self-service portal', time: '3 hr ago' },
  { id: 4, icon: '📋', text: 'Idea approved for bidding', sub: 'Finance dashboard revamp', time: '5 hr ago' },
  { id: 5, icon: '🔍', text: 'Pending review', sub: 'Operations routing tool', time: 'Yesterday' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, accent, icon }) {
  return (
    <div className="surface-card px-5 py-4 flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accent.bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold font-manrope ${accent.text}`}>{value}</p>
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
  const hasDeadline = !!idea.deadline;

  function ActionButton() {
    if (idea.status === 'BiddingOpen') {
      return (
        <button
          onClick={() => onNavigate(`/ideas/${idea._id}/bid`)}
          className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-container px-3.5 py-1.5 text-xs font-semibold text-white shadow-tonal hover:bg-primary-container transition-colors"
        >
          Place bid
        </button>
      );
    }
    if (isAssignee && idea.status === 'InProgress') {
      return (
        <button
          onClick={() => onNavigate(`/ideas/${idea._id}`)}
          className="shrink-0 rounded-lg bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100 transition-colors"
        >
          View project
        </button>
      );
    }
    if (idea.status === 'Completed' || idea.status === 'InProgress') {
      return (
        <button
          onClick={() => onNavigate(`/ideas/${idea._id}`)}
          className="shrink-0 rounded-lg bg-surface-container-low px-3.5 py-1.5 text-xs font-semibold text-on-surface ring-1 ring-inset ring-on-surface-variant/40 hover:bg-surface-container-high transition-colors"
        >
          View
        </button>
      );
    }
    if (isOwner) {
      return (
        <button
          onClick={() => onNavigate(`/ideas/${idea._id}`)}
          className="shrink-0 rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/15 transition-colors"
        >
          View
        </button>
      );
    }
    return (
      <button
        onClick={() => onNavigate(`/ideas/${idea._id}`)}
        className="shrink-0 rounded-lg bg-surface-container-low px-3.5 py-1.5 text-xs font-semibold text-on-surface ring-1 ring-inset ring-on-surface-variant/40 hover:bg-surface-container-high transition-colors"
      >
        View
      </button>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors">
      {/* Left content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Status + title row */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadgeInline status={idea.status} />
          <span className="text-sm font-semibold text-on-surface truncate">{idea.title}</span>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
          {idea.category && (
            <span className="font-medium text-primary">{idea.category}</span>
          )}
          <span>·</span>
          <span>Owner: <span className="text-on-surface font-medium">{ownerName}</span></span>
          {idea.bidCount != null && (
            <>
              <span>·</span>
              <span>{idea.bidCount} bid{idea.bidCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5">
          {idea.projectType && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/10">
              {idea.projectType}
            </span>
          )}
          {idea.size && (
            <span className="inline-flex items-center rounded-md bg-surface-container-low px-2 py-0.5 text-xs font-medium text-on-surface-variant ring-1 ring-inset ring-on-surface-variant/10">
              {idea.size}
            </span>
          )}
          {hasDeadline && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-500/10">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {new Date(idea.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="shrink-0 self-center">
        <ActionButton />
      </div>
    </div>
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
    // Employee: only see BiddingOpen/Approved ideas + ideas assigned to / completed by them
    if (isEmployee) {
      const isOpenForBidding = idea.status === 'BiddingOpen' || idea.status === 'Approved';
      const isMyIdea = idea.assignedTo === user?.id || idea.submittedBy === user?.id ||
        idea.assignedTo?._id === user?.id || idea.submittedBy?._id === user?.id ||
        idea.teamMembers?.some((m) => m.userId === user?.id || m._id === user?.id);
      const isActiveOrDone = ['Assigned', 'InProgress', 'Completed'].includes(idea.status) && isMyIdea;
      if (!isOpenForBidding && !isActiveOrDone) return false;
    }
    if (filters.search && !idea.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category !== 'All' && idea.category !== filters.category) return false;
    if (filters.status   !== 'All' && idea.status   !== filters.status)   return false;
    return true;
  });

  // ── Stat cards config ───────────────────────────────────────────────────────
  const statCards = [
    {
      label:  'Open for Bidding',
      value:  overview?.biddingOpen ?? 0,
      icon:   '🟢',
      accent: { bg: 'bg-green-50',   text: 'text-green-700' },
    },
    {
      label:  'In Progress',
      value:  overview?.inProgress ?? 0,
      icon:   '⚡',
      accent: { bg: 'bg-amber-50',   text: 'text-amber-700' },
    },
    {
      label:  'Pending Review',
      value:  overview?.openIdeas ?? 0,
      icon:   '🔍',
      accent: { bg: 'bg-blue-50',    text: 'text-blue-700' },
    },
    {
      label:  'Completed',
      value:  overview?.completed ?? 0,
      icon:   '✅',
      accent: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    },
  ];

  // ── Medal helper ────────────────────────────────────────────────────────────
  const medal = (i) => ['🥇', '🥈', '🥉'][i] ?? null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Innovation Portal</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Browse, submit, and build ideas that move the company forward.</p>
        </div>
        <Link
          to="/ideas/submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-tonal hover:bg-primary-container active:bg-primary transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Submit idea
        </Link>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Two-column section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Left: Top Builders Leaderboard */}
        <div className="surface-card">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold font-manrope text-on-surface">Top Builders This Month</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Leaderboard
            </span>
          </div>
          <ul>
            {leaderboard.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-on-surface-variant/60">No data yet for this month.</li>
            ) : (
              leaderboard.slice(0, 7).map((entry, i) => (
                <li key={entry.name ?? i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-base">
                      {medal(i) ?? (
                        <span className="text-xs font-medium text-on-surface-variant/60">#{i + 1}</span>
                      )}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary uppercase">
                      {(entry.name ?? '?')[0]}
                    </div>
                    <span className="text-sm font-medium text-on-surface">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{entry.points} pts</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Right: Recent Activity */}
        <div className="surface-card">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold font-manrope text-on-surface">Recent Activity</h2>
            <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
              Live feed
            </span>
          </div>
          <ul>
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface">{item.text}</p>
                  <p className="truncate text-xs text-on-surface-variant">{item.sub}</p>
                </div>
                <span className="shrink-0 text-xs text-on-surface-variant/60">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60"
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search ideas..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="input-field w-full rounded-xl py-2 pl-9 pr-3 text-sm text-on-surface placeholder-on-surface-variant/60 shadow-tonal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          className="input-field rounded-xl px-3 py-2 text-sm text-on-surface shadow-tonal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="input-field rounded-xl px-3 py-2 text-sm text-on-surface shadow-tonal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All statuses' : STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>

        {/* Count badge */}
        <span className="shrink-0 text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{filtered.length}</span>{' '}
          idea{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Idea cards list ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-on-surface-variant/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <p className="text-sm font-medium text-on-surface-variant">No ideas match your filters.</p>
          <button
            onClick={() => setFilters({ search: '', category: 'All', status: 'All' })}
            className="mt-3 text-xs font-medium text-primary hover:text-primary"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden surface-card">
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
  );
}
