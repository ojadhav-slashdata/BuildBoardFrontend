import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

const ALGO_STEPS = [
  { icon: 'timer', label: 'On-time Rate', weight: '40%', desc: 'Past delivery track record', color: '#6366f1' },
  { icon: 'star', label: 'Manager Ratings', weight: '35%', desc: 'Average feedback score', color: '#f59e0b' },
  { icon: 'check_circle', label: 'Completion Rate', weight: '25%', desc: 'Ideas finished vs started', color: '#10b981' },
  { icon: 'rocket_launch', label: 'Early Bonus', weight: '+2/day', desc: 'Up to +20 for early commit', color: '#3b82f6' },
  { icon: 'warning', label: 'Late Penalty', weight: '-10', desc: 'For committing past deadline', color: '#ef4444' },
];

export default function BidDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdea, setExpandedIdea] = useState(null);
  const [algoStep, setAlgoStep] = useState(0);
  const [showAlgo, setShowAlgo] = useState(false);
  const [assigning, setAssigning] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/bids/dashboard')
      .then(r => setData(r.data))
      .catch(err => {
        console.error('Bid dashboard error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, []);

  // Animate algorithm steps
  useEffect(() => {
    if (!showAlgo) return;
    const t = setInterval(() => setAlgoStep(p => (p + 1) % ALGO_STEPS.length), 2500);
    return () => clearInterval(t);
  }, [showAlgo]);

  const handleAssign = async (bidId, ideaId) => {
    setAssigning(bidId);
    try {
      await api.patch(`/bids/${bidId}/assign`);
      // Refresh
      const r = await api.get('/bids/dashboard');
      setData(r.data);
    } catch { alert('Failed to assign'); }
    setAssigning(null);
  };

  const handleAutoAssign = async (ideaId) => {
    setAssigning(ideaId);
    try {
      await api.post(`/bids/auto-assign/${ideaId}`);
      const r = await api.get('/bids/dashboard');
      setData(r.data);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    setAssigning(null);
  };

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant">Loading...</div>;
  if (error) return (
    <div className="text-center py-20">
      <span className="material-symbols-outlined text-4xl text-error/50 mb-3 block">error</span>
      <p className="text-error font-medium">{error}</p>
      <p className="text-sm text-on-surface-variant mt-2">Make sure you are logged in as Manager or Admin</p>
      <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
    </div>
  );
  if (!data) return <div className="text-center py-20 text-on-surface-variant">No data available</div>;

  const { dashboard, algorithm } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Bid Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">{dashboard.length} idea{dashboard.length !== 1 ? 's' : ''} with bids</p>
        </div>
        <button onClick={() => setShowAlgo(!showAlgo)}
          className="btn-primary inline-flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-lg">psychology</span>
          {showAlgo ? 'Hide Algorithm' : 'View Ranking Algorithm'}
        </button>
      </div>

      {/* Algorithm Animation */}
      {showAlgo && (
        <div className="surface-card-elevated p-8 rounded-3xl">
          <h3 className="text-lg font-bold font-manrope text-on-surface mb-2">Bid Ranking Algorithm</h3>
          <p className="text-sm text-on-surface-variant mb-6">How BuildBoard automatically ranks and recommends the best bid</p>

          {/* Formula */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6">
            <p className="text-xs text-on-surface-variant mb-1">Formula</p>
            <p className="font-mono text-sm font-bold text-primary">Score = (OnTimeRate × 40) + (AvgRating/5 × 35) + (CompletionRate × 25) + DeliveryBonus</p>
            <p className="text-xs text-on-surface-variant mt-2">New builders start at 50/100. Team bids use the average of all confirmed members.</p>
          </div>

          {/* Animated Steps */}
          <div className="grid grid-cols-5 gap-3">
            {ALGO_STEPS.map((step, i) => {
              const isActive = i === algoStep;
              return (
                <div key={i} className={`p-4 rounded-2xl text-center transition-all duration-700 ${
                  isActive ? 'scale-105 shadow-tonal-md' : 'scale-100 opacity-60'
                }`} style={isActive ? { background: `${step.color}10`, boxShadow: `0 0 30px ${step.color}15` } : { background: 'var(--color-surface-container-low)' }}>
                  <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: step.color, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{step.icon}</span>
                  <p className="text-xs font-bold text-on-surface">{step.label}</p>
                  <p className="text-lg font-bold font-manrope mt-1" style={{ color: step.color }}>{step.weight}</p>
                  <p className={`text-[10px] text-on-surface-variant mt-1 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{step.desc}</p>
                  {isActive && <div className="w-2 h-2 rounded-full mx-auto mt-2 animate-pulse" style={{ background: step.color }} />}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mt-4 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-[2500ms] ease-linear"
              style={{ width: `${((algoStep + 1) / ALGO_STEPS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Ideas with Bids */}
      {dashboard.length === 0 ? (
        <div className="surface-card-elevated p-12 text-center rounded-3xl">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">inbox</span>
          <p className="text-on-surface-variant">No ideas have received bids yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboard.map(item => {
            const isExpanded = expandedIdea === item.idea.id;
            const hasWinner = !!item.winner;
            const isBiddingOpen = item.idea.status === 'BiddingOpen';
            const cutoffPassed = item.idea.cutoffDate && new Date(item.idea.cutoffDate) < new Date();

            return (
              <div key={item.idea.id} className="surface-card-elevated rounded-3xl overflow-hidden">
                {/* Idea Header */}
                <div className="p-5 cursor-pointer hover:bg-surface-container-low/50 transition-colors"
                  onClick={() => setExpandedIdea(isExpanded ? null : item.idea.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        hasWinner ? 'bg-emerald-100 text-emerald-700' : isBiddingOpen ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {hasWinner ? '✓' : item.totalBids}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{item.idea.title}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {item.idea.size} · {item.idea.complexity} · {item.totalBids} bid{item.totalBids !== 1 ? 's' : ''}
                          {item.idea.autoAssigned && ' · Auto-assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasWinner && (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium ring-1 ring-inset ring-emerald-600/20">
                          Winner: {item.winner.bidder}
                        </span>
                      )}
                      {isBiddingOpen && !cutoffPassed && (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium ring-1 ring-inset ring-green-600/20">Bidding Open</span>
                      )}
                      {isBiddingOpen && cutoffPassed && !hasWinner && (
                        <button onClick={(e) => { e.stopPropagation(); handleAutoAssign(item.idea.id); }}
                          disabled={assigning === item.idea.id}
                          className="text-xs px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 disabled:opacity-50">
                          {assigning === item.idea.id ? 'Assigning...' : 'Auto-Assign Now'}
                        </button>
                      )}
                      <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Bids */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/30">
                    {/* Score bar chart visualization */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Bid Comparison — Score out of 100</p>
                      <div className="space-y-2">
                        {item.bids.map(bid => (
                          <div key={bid.id} className="flex items-center gap-3">
                            <div className="w-24 text-xs font-medium text-on-surface truncate">{bid.bidder}</div>
                            <div className="flex-1 h-6 bg-surface-container-high rounded-full overflow-hidden relative">
                              <div className={`h-full rounded-full transition-all duration-1000 ${
                                bid.isWinner ? 'bg-gradient-to-r from-primary to-primary-container' :
                                bid.isWithinDeadline ? 'bg-surface-container-highest' : 'bg-red-200'
                              }`} style={{ width: `${bid.score}%` }} />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface">{bid.score}</span>
                            </div>
                            <div className="w-20 text-right">
                              {bid.isWinner ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">WINNER</span>
                              ) : bid.status === 'Not Selected' ? (
                                <span className="text-[10px] text-on-surface-variant/50">Not selected</span>
                              ) : !hasWinner ? (
                                <button onClick={() => handleAssign(bid.id, item.idea.id)}
                                  disabled={assigning === bid.id || !bid.isWithinDeadline}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-on-primary font-medium disabled:opacity-30">
                                  Assign
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Bid Cards */}
                    <div className="space-y-3">
                      {item.bids.map(bid => (
                        <div key={bid.id} className={`bg-surface-container-lowest rounded-2xl p-4 ${
                          bid.isWinner ? 'ring-2 ring-primary/20' : ''
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {bid.bidderAvatar ? (
                                <img src={bid.bidderAvatar} className="w-7 h-7 rounded-full" alt="" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{bid.bidder[0]}</div>
                              )}
                              <span className="font-medium text-sm text-on-surface">{bid.bidder}</span>
                              {bid.isWinner && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Winner</span>}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">{bid.mode === 'team' ? 'Team' : 'Solo'}</span>
                            </div>
                            <span className="text-sm font-bold text-primary">{bid.score}/100</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs mb-2">
                            <div>
                              <span className="text-on-surface-variant">Committed:</span>
                              <span className="ml-1 font-medium text-on-surface">{bid.committedDate ? new Date(bid.committedDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-on-surface-variant">vs Expected:</span>
                              <span className={`ml-1 font-medium ${bid.daysVsExpected >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {bid.daysVsExpected > 0 ? `${bid.daysVsExpected}d early` : bid.daysVsExpected < 0 ? `${Math.abs(bid.daysVsExpected)}d late` : 'On time'}
                              </span>
                            </div>
                            <div>
                              <span className="text-on-surface-variant">Deadline:</span>
                              <span className={`ml-1 font-medium ${bid.isWithinDeadline ? 'text-emerald-600' : 'text-red-600'}`}>
                                {bid.isWithinDeadline ? '✓ Within' : '✗ Over'}
                              </span>
                            </div>
                          </div>
                          {bid.approach && <p className="text-xs text-on-surface-variant line-clamp-2">{bid.approach}</p>}
                          {bid.lateJustification && (
                            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                              <p className="text-[10px] font-medium text-amber-700">Late justification:</p>
                              <p className="text-xs text-amber-800">{bid.lateJustification}</p>
                            </div>
                          )}
                          {bid.teamMembers && bid.teamMembers.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {bid.teamMembers.map((m, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                                  {m.name} {m.confirmed ? '✓' : '⏳'}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Win reasons */}
                          {bid.isWinner && (
                            <div className="mt-3 pt-3 border-t border-outline-variant/10">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">Why this bid won</p>
                              <ul className="text-xs text-on-surface-variant space-y-0.5">
                                <li className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Highest performance score: {bid.score}/100</li>
                                {bid.isWithinDeadline && <li className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Committed delivery within deadline</li>}
                                {bid.daysVsExpected > 0 && <li className="flex items-center gap-1"><span className="text-emerald-500">✓</span> {bid.daysVsExpected} days before expected delivery</li>}
                                {bid.isAutoAssigned && <li className="flex items-center gap-1"><span className="text-primary">⚡</span> Auto-assigned after bid cutoff passed</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
