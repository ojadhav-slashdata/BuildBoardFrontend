import { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../axiosConfig';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Tech', 'HR', 'Finance', 'Operations', 'Other'];
const STATUSES   = ['All', 'BiddingOpen', 'InProgress', 'PendingApproval', 'Completed'];

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

function StatusBadgeInline({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-surface-container-low text-on-surface-variant ring-on-surface-variant/20';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

function IdeaCard({ idea, currentUserId, usersMap, onNavigate }) {
  const isOwner     = idea.submittedBy?._id === currentUserId || idea.submittedBy === currentUserId;
  const isAssignee  = idea.assignedTo?._id === currentUserId  || idea.assignedTo  === currentUserId;
  const ownerId     = idea.submittedBy?._id || idea.submittedBy;
  const ownerName   = idea.submittedBy?.name || usersMap[ownerId] || 'Unknown';

  return (
    <article
      onClick={() => onNavigate(`/ideas/${idea._id}`)}
      className="bg-surface-container-lowest p-6 rounded-2xl hover:shadow-tonal-md transition-all duration-200 group cursor-pointer"
    >
      <div className="space-y-3">
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

        <h3 className="text-lg font-bold font-manrope text-on-surface group-hover:text-primary transition-colors">{idea.title}</h3>

        {idea.description && (
          <p className="text-on-surface-variant text-sm line-clamp-2 leading-relaxed">{idea.description}</p>
        )}

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
              onClick={(e) => { e.stopPropagation(); onNavigate(`/ideas/${idea._id}`); }}
              className="px-4 py-2 text-primary font-bold text-sm hover:bg-primary/5 rounded-full transition-colors"
            >
              {idea.status === 'PendingApproval' ? 'Review' : 'Details'}
            </button>
            {idea.status === 'BiddingOpen' && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(`/ideas/${idea._id}/bid`); }}
                className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-2 text-xs font-semibold text-white shadow-tonal hover:shadow-tonal-md transition-all duration-200"
              >
                Place bid
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AllIdeas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  const [ideas, setIdeas] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
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
    if (status === 'All') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const isEmployee = user?.role === 'Employee';
  const filtered = ideas.filter((idea) => {
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
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">All Ideas</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Browse and discover innovation ideas across the organization.</p>
        </div>
      </div>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-xl">
        <div className="flex-grow relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search ideas..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="input-field w-full pl-12 pr-4"
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
            onChange={(e) => updateStatus(e.target.value)}
            className="flex items-center gap-2 px-4 py-3 bg-surface-container-lowest text-on-surface font-medium rounded-lg hover:bg-surface-container-high transition-colors text-sm outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All statuses' : STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Results */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold font-manrope tracking-tight text-on-surface">
          {filters.status !== 'All' ? (STATUS_LABELS[filters.status] || filters.status) : 'All Ideas'}
        </h2>
        <span className="text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{filtered.length}</span> idea{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">search</span>
          <p className="text-sm font-medium text-on-surface-variant">No ideas match your filters.</p>
          <button
            onClick={() => { setFilters({ search: '', category: 'All', status: 'All' }); setSearchParams({}); }}
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
              usersMap={usersMap}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
