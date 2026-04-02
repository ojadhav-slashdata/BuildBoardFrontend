import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../axiosConfig';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_STYLES = {
  BiddingOpen:     'bg-green-500',
  InProgress:      'bg-amber-500',
  PendingApproval: 'bg-blue-500',
  Completed:       'bg-emerald-500',
  Rejected:        'bg-red-500',
  Draft:           'bg-gray-400',
  BiddingClosed:   'bg-slate-500',
  Assigned:        'bg-purple-500',
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

const MOTIVATIONAL = [
  'Ready to build something great today?',
  'Your next big idea is waiting.',
  'Innovation starts with a single step.',
  'Let\'s make an impact together.',
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatCard({ label, value, materialIcon, accent, badge, onClick }) {
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

export default function Portal() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [overview, setOverview] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/dashboard'),
      api.get('/ideas'),
      api.get('/bids/mine').catch(() => ({ data: [] })),
      api.get('/users').catch(() => ({ data: [] })),
    ])
      .then(([overviewRes, dashRes, ideasRes, bidsRes, usersRes]) => {
        setOverview(overviewRes.data);
        setLeaderboard(dashRes.data?.leaderboard ?? []);
        setIdeas(ideasRes.data ?? []);
        setMyBids(bidsRes.data ?? []);
        const map = {};
        (usersRes.data ?? []).forEach((u) => { map[u._id || u.id] = u.name; });
        setUsersMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = (user?.name || 'there').split(' ')[0];
  const subtitle = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];

  // Needs Your Attention — role-specific actionable items
  const myBidIdeaIds = new Set((myBids || []).map((b) => b.idea?._id || b.idea));
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager' || user?.role === 'manager';

  const needsAttention = [];

  // For everyone: ideas open for bidding that user hasn't bid on
  ideas
    .filter((i) => i.status === 'BiddingOpen' && !myBidIdeaIds.has(i._id) && i.submittedBy !== user?.id && (!i.bidCutoffDate || new Date(i.bidCutoffDate).getTime() > Date.now()))
    .slice(0, 4)
    .forEach((i) => {
      needsAttention.push({ id: i._id, type: 'bid', title: i.title, sub: 'Open for bidding — place your bid', icon: 'gavel', link: `/ideas/${i._id}/bid` });
    });

  if (isAdmin || isManager) {
    // Pending approvals
    ideas.filter((i) => i.status === 'PendingApproval').forEach((i) => {
      needsAttention.push({ id: i._id, type: 'review', title: i.title, sub: 'Awaiting your approval', icon: 'rate_review', link: `/approvals?review=${i._id}` });
    });
    // Completed ideas awaiting feedback
    ideas.filter((i) => i.status === 'Completed').forEach((i) => {
      needsAttention.push({ id: `fb-${i._id}`, type: 'feedback', title: i.title, sub: 'Completed — rate delivery', icon: 'star_rate', link: `/ideas/${i._id}/feedback` });
    });
    // Bidding past cutoff — assign winner
    ideas.filter((i) => i.status === 'BiddingOpen' && i.bidCutoffDate && new Date(i.bidCutoffDate).getTime() < Date.now()).forEach((i) => {
      needsAttention.push({ id: `assign-${i._id}`, type: 'assign', title: i.title, sub: 'Bidding closed — assign winner', icon: 'assignment_turned_in', link: `/bids/${i._id}` });
    });
  }

  // Recent Activity: last 5 ideas sorted by date
  const recentIdeas = [...ideas]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
    .slice(0, 5);

  const statCards = [
    {
      label: 'Open for Bidding', value: overview?.biddingOpen ?? 0,
      materialIcon: 'bid_landscape', badge: 'Active',
      accent: { bg: 'bg-primary/5', text: 'text-primary', iconColor: 'text-primary', bar: 'bg-primary' },
      onClick: () => navigate('/all-ideas?status=BiddingOpen'),
    },
    {
      label: 'In Progress', value: overview?.inProgress ?? 0,
      materialIcon: 'manufacturing',
      accent: { bg: 'bg-secondary/5', text: 'text-secondary', iconColor: 'text-secondary', bar: 'bg-secondary' },
      onClick: () => navigate('/all-ideas?status=InProgress'),
    },
    {
      label: 'Pending Review', value: overview?.openIdeas ?? 0,
      materialIcon: 'rate_review',
      accent: { bg: 'bg-tertiary/5', text: 'text-tertiary', iconColor: 'text-tertiary', bar: 'bg-tertiary' },
      onClick: () => navigate('/all-ideas?status=PendingApproval'),
    },
    {
      label: 'Completed', value: overview?.completed ?? 0,
      materialIcon: 'verified',
      accent: { bg: 'bg-emerald-500/5', text: 'text-emerald-600', iconColor: 'text-emerald-600', bar: 'bg-emerald-500' },
      onClick: () => navigate('/all-ideas?status=Completed'),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10">
      {/* Personalized greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-manrope tracking-tight text-on-surface">
            Hello, {firstName} <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>
        </div>
        <Link to="/ideas/submit" className="btn-primary inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-lg">add</span>
          Submit idea
        </Link>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">

          {/* Needs Your Attention */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
              <h2 className="text-xl font-bold font-manrope tracking-tight text-on-surface">Needs Your Attention</h2>
              {needsAttention.length > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{needsAttention.length}</span>
              )}
            </div>
            {needsAttention.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 mb-2">check_circle</span>
                <p className="text-sm text-on-surface-variant">You're all caught up! No pending actions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {needsAttention.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => navigate(item.link)}
                    className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl hover:shadow-tonal-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className={`p-2.5 rounded-xl ${
                      item.type === 'review' ? 'bg-blue-50 text-blue-600' :
                      item.type === 'feedback' ? 'bg-amber-50 text-amber-600' :
                      item.type === 'assign' ? 'bg-purple-50 text-purple-600' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">{item.title}</p>
                      <p className="text-xs text-on-surface-variant">{item.sub}</p>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40 group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-manrope tracking-tight text-on-surface">Recent Activity</h2>
              <Link to="/all-ideas" className="text-sm font-semibold text-primary hover:underline">View all ideas &rarr;</Link>
            </div>
            <div className="relative space-y-4 pl-4 before:content-[''] before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-[2px] before:bg-surface-container-high">
              {recentIdeas.map((idea) => {
                const ownerId = idea.submittedBy?._id || idea.submittedBy;
                const ownerName = idea.submittedBy?.name || usersMap[ownerId] || 'Someone';
                return (
                  <div key={idea._id} className="relative flex gap-4">
                    <div className={`w-3 h-3 rounded-full ${STATUS_STYLES[idea.status] || 'bg-gray-400'} mt-2 ring-4 ring-surface shadow-sm z-10 shrink-0`} />
                    <div
                      onClick={() => navigate(`/ideas/${idea._id}`)}
                      className="bg-surface-container-lowest p-4 rounded-xl shadow-tonal flex-grow cursor-pointer hover:shadow-tonal-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-grow">
                          <p className="text-sm font-bold text-on-surface truncate">{idea.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {ownerName} &middot; {STATUS_LABELS[idea.status] || idea.status}
                          </p>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/50 shrink-0 ml-3">{timeAgo(idea.createdAt || idea.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right sidebar: Leaderboard */}
        <div className="space-y-8">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              Top Builders
            </h2>
            <ul className="space-y-3">
              {leaderboard.length === 0 ? (
                <li className="py-8 text-center text-sm text-on-surface-variant/60">No data yet.</li>
              ) : (
                leaderboard.slice(0, 5).map((entry, i) => {
                  const userMatch = Object.values(usersMap).find(u => u.name === entry.name);
                  const avatar = userMatch?.pictureUrl;
                  return (
                  <li key={entry.name ?? i} className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-2xl hover:translate-x-0.5 transition-transform">
                    <span className="w-6 text-center font-bold text-primary italic">
                      {['🥇', '🥈', '🥉'][i] ?? (i + 1)}
                    </span>
                    {avatar ? (
                      <img src={avatar} alt={entry.name} className="h-10 w-10 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {(entry.name ?? '?')[0]}
                      </div>
                    )}
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{entry.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary">{entry.points}</p>
                      <p className="text-[10px] text-on-surface-variant">pts</p>
                    </div>
                  </li>
                  );
                })
              )}
            </ul>
            {(user?.role === 'Manager' || user?.role === 'Admin') && (
              <Link to="/analytics" className="block w-full mt-6 py-3 text-center text-on-surface-variant text-sm font-bold rounded-xl hover:bg-surface-container-high transition-colors">
                Full Leaderboard &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
