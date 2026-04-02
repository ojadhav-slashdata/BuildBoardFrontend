import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

const CATEGORIES = ['All', 'Tech', 'HR', 'Finance', 'Operations', 'Other'];
const SIZES = ['All', 'Micro', 'Small', 'Medium', 'Large', 'XL', 'Enterprise'];

export default function BrowseIdeas() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'All', size: 'All' });

  useEffect(() => {
    api.get('/ideas?status=BiddingOpen')
      .then(res => setIdeas(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = ideas.filter(idea => {
    if (filters.search && !idea.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category !== 'All' && idea.category !== filters.category) return false;
    if (filters.size !== 'All' && idea.size !== filters.size) return false;
    return true;
  });

  const getTimeLeft = (cutoff) => {
    if (!cutoff) return null;
    const cutoffTime = new Date(cutoff).getTime();
    if (!cutoffTime || cutoffTime <= 0) return null;
    const diff = cutoffTime - Date.now();
    if (diff <= 0) return { text: 'Closed', urgent: true };
    if (diff < 3600000) return { text: `${Math.floor(diff / 60000)}m left`, urgent: true };
    if (diff < 86400000) return { text: `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m left`, urgent: true };
    const days = Math.floor(diff / 86400000);
    return { text: `${days}d left`, urgent: days <= 2 };
  };

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant">Loading ideas...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Place a Bid</h1>
        <p className="text-sm text-on-surface-variant mt-1">Browse ideas open for bidding and submit your proposal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-3xl font-bold font-manrope text-primary">{ideas.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Open for bidding</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-3xl font-bold font-manrope text-amber-600">
            {ideas.filter(i => {
              const diff = i.bidCutoffDate ? new Date(i.bidCutoffDate) - new Date() : Infinity;
              return diff > 0 && diff < 3 * 86400000;
            }).length}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Closing soon (3 days)</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-3xl font-bold font-manrope text-emerald-600">
            {ideas.filter(i => i.projectType === 'POC').length}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">POC ideas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-4 rounded-xl">
        <div className="flex-grow relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search ideas..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="px-3 py-2.5 bg-surface-container-lowest rounded-lg text-sm text-on-surface outline-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
        </select>
        <select value={filters.size} onChange={e => setFilters(f => ({ ...f, size: e.target.value }))}
          className="px-3 py-2.5 bg-surface-container-lowest rounded-lg text-sm text-on-surface outline-none">
          {SIZES.map(s => <option key={s} value={s}>{s === 'All' ? 'All sizes' : s}</option>)}
        </select>
        <span className="text-xs text-on-surface-variant">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Ideas Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">search_off</span>
          <p className="text-on-surface-variant font-medium">No ideas open for bidding right now</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Check back later or submit your own idea!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(idea => {
            const timeLeft = getTimeLeft(idea.bidCutoffDate);
            return (
              <div key={idea._id || idea.id}
                className="bg-surface-container-lowest rounded-2xl p-5 hover:shadow-tonal-md transition-all duration-200 group cursor-pointer"
                onClick={() => navigate(`/ideas/${idea._id || idea.id}`)}>

                {/* Top: Tags + Countdown */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">{idea.category || 'Other'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold uppercase">{idea.projectType === 'FullProduct' ? 'Full Product' : 'POC'}</span>
                    {idea.size && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold">{idea.size}</span>}
                  </div>
                  {timeLeft && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                      timeLeft.urgent ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    }`}>
                      <span className="material-symbols-outlined text-xs">timer</span>
                      {timeLeft.text}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold font-manrope text-on-surface group-hover:text-primary transition-colors mb-1.5">{idea.title}</h3>

                {/* Description */}
                <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed mb-4">{idea.description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                      {(idea.projectOwner || '?')[0]}
                    </div>
                    <span className="text-xs text-on-surface-variant">{idea.projectOwner || 'No owner'}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/ideas/${idea._id || idea.id}/bid`); }}
                    className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-2 text-xs font-semibold text-white shadow-tonal hover:shadow-tonal-md transition-all duration-200 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">gavel</span>
                    Place Bid
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
