import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const categories = ['All', 'AI/ML', 'Automation', 'DevTools', 'UX', 'Infrastructure', 'Other'];
const sizeOptions = [
  { value: 'All', label: 'All Sizes' },
  { value: 'Micro', label: 'Micro (< 4 hrs)' },
  { value: 'Small', label: 'Small (1–2 days)' },
  { value: 'Medium', label: 'Medium (3–5 days)' },
  { value: 'Large', label: 'Large (1–2 weeks)' },
  { value: 'XL', label: 'XL (1–2 months)' },
  { value: 'Enterprise', label: 'Enterprise (3+ months)' },
];
const projectTypes = ['All', 'POC', 'FullProduct'];

export default function Portal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'All', size: 'All', projectType: 'All' });

  useEffect(() => {
    Promise.all([api.get('/analytics/overview'), api.get('/ideas')])
      .then(([m, i]) => {
        setMetrics(m.data);
        setIdeas(i.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Employee: only see BiddingOpen ideas + ideas assigned to / in progress / completed by them
  // Manager/Admin: see everything
  const isEmployee = user?.role === 'Employee';

  const filtered = ideas.filter((idea) => {
    if (isEmployee) {
      const isOpenForBidding = idea.status === 'BiddingOpen' || idea.status === 'Approved';
      const isMyIdea = idea.assignedTo === user?.id || idea.submittedBy === user?.id ||
        idea.teamMembers?.some((m) => m.userId === user?.id);
      const isActiveOrDone = ['Assigned', 'InProgress', 'Completed'].includes(idea.status) && isMyIdea;
      if (!isOpenForBidding && !isActiveOrDone) return false;
    }
    if (filters.search && !idea.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category !== 'All' && idea.category !== filters.category) return false;
    if (filters.size !== 'All' && idea.size !== filters.size) return false;
    if (filters.projectType !== 'All' && idea.projectType !== filters.projectType) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  const metricCards = [
    { label: 'Open Ideas', value: metrics?.openIdeas ?? 0, color: 'text-blue-600' },
    { label: 'In Progress', value: metrics?.inProgress ?? 0, color: 'text-indigo-600' },
    { label: 'Bidding Open', value: metrics?.biddingOpen ?? 0, color: 'text-purple-600' },
    { label: 'Completed', value: metrics?.completed ?? 0, color: 'text-green-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Innovation Portal</h1>
        <button
          onClick={() => navigate('/ideas/submit')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Submit Idea
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metricCards.map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search ideas..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
        />
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.size} onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {sizeOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.projectType} onChange={(e) => setFilters((f) => ({ ...f, projectType: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {projectTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Idea List */}
      {filtered.length === 0 ? (
        <EmptyState message="No ideas match your filters." icon="🔍" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
          {filtered.map((idea) => (
            <div key={idea._id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-800">{idea.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${idea.projectType === 'POC' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                  {idea.projectType}
                </span>
                {idea.size && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{idea.size}</span>
                )}
                <StatusBadge status={idea.status} />
              </div>
              <div>
                {idea.status === 'BiddingOpen' ? (
                  <button
                    onClick={() => navigate(`/ideas/${idea._id}/bid`)}
                    className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition"
                  >
                    Place Bid
                  </button>
                ) : idea.status === 'BiddingClosed' ? (
                  <span className="text-sm bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-medium cursor-not-allowed">
                    Bidding Closed
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(`/ideas/${idea._id}`)}
                    className="text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
