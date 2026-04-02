import { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../axiosConfig';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Tech', 'HR', 'Finance', 'Operations', 'Other'];
const STATUSES   = ['All', 'BiddingOpen', 'InProgress', 'PendingApproval', 'Completed'];

const STATUS_STYLES = {
  BiddingOpen:     'bg-sky-50 text-sky-600',
  InProgress:      'bg-amber-50 text-amber-600',
  PendingApproval: 'bg-blue-50 text-blue-600',
  Completed:       'bg-emerald-50 text-emerald-600',
  Rejected:        'bg-red-50 text-red-600',
  Draft:           'bg-slate-50 text-slate-500',
  BiddingClosed:   'bg-slate-50 text-slate-500',
  Assigned:        'bg-purple-50 text-purple-600',
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

const CATEGORY_ICONS = {
  Tech:       'computer',
  HR:         'groups',
  Finance:    'payments',
  Operations: 'settings',
  Other:      'lightbulb',
  All:        'apps',
};

const PAGE_SIZE = 9;

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-50 text-slate-500';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function IdeaCard({ idea, currentUserId, usersMap, onNavigate }) {
  const ownerId   = idea.submittedBy?._id || idea.submittedBy;
  const ownerName = idea.submittedBy?.name || usersMap[ownerId] || 'Unknown';
  const ownerDept = idea.submittedBy?.department || idea.department || '';
  const points    = idea.pointsValue ?? idea.points ?? null;
  const category  = idea.category || 'Other';
  const catIcon   = CATEGORY_ICONS[category] || 'lightbulb';
  const timeEst   = idea.estimatedTime || idea.duration || null;

  const handleBid = (e) => {
    e.stopPropagation();
    onNavigate(`/ideas/${idea._id}/bid`);
  };

  const handleView = (e) => {
    e.stopPropagation();
    onNavigate(`/ideas/${idea._id}`);
  };

  return (
    <article
      onClick={() => onNavigate(`/ideas/${idea._id}`)}
      className="group relative bg-surface-container-lowest rounded-lg p-8 flex flex-col gap-5 cursor-pointer
                 transition-all duration-300
                 border border-transparent
                 hover:border-primary/10
                 hover:shadow-[0px_20px_40px_rgba(0,101,146,0.06)]"
    >
      {/* Top row: status badge + points */}
      <div className="flex items-center justify-between">
        <StatusBadge status={idea.status} />
        {points != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-bold text-primary">
            <span className="material-symbols-outlined text-[13px]">star</span>
            {points} pts
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-headline font-bold leading-tight text-on-surface group-hover:text-primary transition-colors duration-200">
        {idea.title}
      </h3>

      {/* Description */}
      {idea.description && (
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-8 flex-1">
          {idea.description}
        </p>
      )}

      {/* Owner row */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {(ownerName || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{ownerName}</p>
          {ownerDept && (
            <p className="text-xs text-on-surface-variant truncate">{ownerDept}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-5 text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">{catIcon}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest">{category}</span>
        </span>
        {timeEst && (
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">{timeEst}</span>
          </span>
        )}
        {idea.bidCount != null && (
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">group</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">{idea.bidCount} bid{idea.bidCount !== 1 ? 's' : ''}</span>
          </span>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 pt-1 border-t border-outline-variant/30">
        {idea.status === 'BiddingOpen' && (
          <button
            onClick={handleBid}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white text-center
                       hover:bg-primary/90 transition-colors duration-200"
          >
            Bid Now
          </button>
        )}
        {idea.status === 'InProgress' && (
          <button
            onClick={handleView}
            className="flex-1 rounded-xl border border-primary py-2.5 text-sm font-bold text-primary text-center
                       hover:bg-primary/5 transition-colors duration-200"
          >
            View Progress
          </button>
        )}
        {idea.status === 'Completed' && (
          <button
            disabled
            className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-bold text-on-surface-variant text-center
                       opacity-50 cursor-not-allowed"
          >
            Case Study
          </button>
        )}
        {!['BiddingOpen', 'InProgress', 'Completed'].includes(idea.status) && (
          <button
            onClick={handleView}
            className="flex-1 rounded-xl border border-primary py-2.5 text-sm font-bold text-primary text-center
                       hover:bg-primary/5 transition-colors duration-200"
          >
            {idea.status === 'PendingApproval' ? 'Review' : 'Details'}
          </button>
        )}

        {/* Share / view icon button */}
        <button
          onClick={handleView}
          className="w-10 h-10 rounded-xl border border-outline-variant flex items-center justify-center
                     text-on-surface-variant hover:border-primary hover:text-primary transition-colors duration-200"
          aria-label="View idea"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </button>
      </div>
    </article>
  );
}

export default function AllIdeas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  const [ideas, setIdeas]     = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy]   = useState('newest');

  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    status: searchParams.get('status') || 'All',
  });

  useEffect(() => {
    Promise.all([
      api.get('/ideas'),
      api.get('/users').catch(() => ({ data: [] })),
    ])
      .then(([ideasRes, usersRes]) => {
        setIdeas(ideasRes.data ?? []);
        const map = {};
        (usersRes.data ?? []).forEach((u) => { map[u._id || u.id] = u.name; });
        setUsersMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sync status filter from URL
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== filters.status) {
      setFilters((f) => ({ ...f, status: urlStatus }));
    }
  }, [searchParams]);

  // Sync status filter to URL
  const updateStatus = (status) => {
    setFilters((f) => ({ ...f, status }));
    setPage(1);
    if (status === 'All') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const updateCategory = (category) => {
    setFilters((f) => ({ ...f, category }));
    setPage(1);
  };

  const isEmployee = user?.role === 'Employee';
  const filtered = ideas
    .filter((idea) => {
      if (isEmployee) {
        const isOpenForBidding = idea.status === 'BiddingOpen';
        const isMyIdea =
          idea.submittedBy === user?.id || idea.submittedBy?._id === user?.id ||
          idea.assignedTo === user?.id || idea.assignedTo?._id === user?.id ||
          idea.projectOwner === user?.name || idea.projectOwner === user?.email ||
          idea.teamMembers?.some((m) => m.id === user?.id || m.userId === user?.id);
        if (!isOpenForBidding && !isMyIdea) return false;
      }
      if (filters.search && !idea.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category !== 'All' && idea.category !== filters.category) return false;
      if (filters.status !== 'All' && idea.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'bids')   return (b.bidCount || 0) - (a.bidCount || 0);
      if (sortBy === 'points') return (b.pointsValue ?? b.points ?? 0) - (a.pointsValue ?? a.points ?? 0);
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'bids',   label: 'Most Bids' },
    { value: 'points', label: 'Highest Points' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-on-surface leading-none">
            All Ideas
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Browse and discover innovation ideas across the organization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search ideas…"
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/60
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all w-56"
            />
          </div>

          {/* Sort By */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant
                         bg-surface-container-lowest text-sm font-semibold text-on-surface
                         hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">sort</span>
              Sort By
              <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-surface-container-lowest rounded-md border border-outline-variant
                              shadow-[0px_8px_24px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); setPage(1); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${sortBy === opt.value
                        ? 'bg-primary/8 text-primary font-semibold'
                        : 'text-on-surface hover:bg-surface-container-high'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="space-y-3">
        {/* Row 1: Categories */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant w-20 shrink-0">
            Category
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => updateCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150
                  ${filters.category === c
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'}`}
              >
                {c === 'All' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Statuses */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant w-20 shrink-0">
            Status
          </span>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150
                  ${filters.status === s
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'}`}
              >
                {s === 'All' ? 'All Statuses' : (STATUS_LABELS[s] ?? s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count + clear ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          Showing{' '}
          <span className="font-bold text-on-surface">{paginated.length}</span>
          {' '}of{' '}
          <span className="font-bold text-on-surface">{filtered.length}</span>
          {' '}idea{filtered.length !== 1 ? 's' : ''}
        </p>
        {(filters.category !== 'All' || filters.status !== 'All' || filters.search) && (
          <button
            onClick={() => { setFilters({ search: '', category: 'All', status: 'All' }); setSearchParams({}); setPage(1); }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/25 mb-4">search_off</span>
          <p className="text-base font-semibold text-on-surface-variant">No ideas match your filters.</p>
          <button
            onClick={() => { setFilters({ search: '', category: 'All', status: 'All' }); setSearchParams({}); setPage(1); }}
            className="mt-4 text-sm font-bold text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginated.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              currentUserId={user?.id}
              usersMap={usersMap}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant/40">
          <p className="text-sm text-on-surface-variant">
            Page <span className="font-bold text-on-surface">{page}</span> of{' '}
            <span className="font-bold text-on-surface">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center
                         text-on-surface-variant hover:border-primary hover:text-primary transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-on-surface-variant text-sm">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors
                      ${page === item
                        ? 'bg-primary text-white'
                        : 'border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center
                         text-on-surface-variant hover:border-primary hover:text-primary transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
