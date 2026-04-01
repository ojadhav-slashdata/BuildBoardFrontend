import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

export default function BidResults() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bids/results/${ideaId}`).then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [ideaId]);

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant/60">Loading results...</div>;
  if (!data) return <div className="text-center py-20 text-on-surface-variant/60">No results found</div>;

  const { idea, bids, winner } = data;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline mb-3">← Back</button>
        <h1 className="text-xl font-medium font-manrope tracking-tight text-on-surface">Bid Results</h1>
        <p className="text-sm text-on-surface-variant mt-1">{idea.title}</p>
      </div>

      {/* Idea Summary */}
      <div className="surface-card p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-medium font-manrope text-on-surface">{idea.title}</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              {idea.size} · {idea.complexity} complexity · Cutoff: {idea.bidCutoffDate ? new Date(idea.bidCutoffDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            {idea.autoAssigned && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Auto-assigned</span>
            )}
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
              idea.status === 'InProgress' ? 'bg-amber-50 text-amber-700' :
              idea.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}>{idea.status}</span>
          </div>
        </div>
      </div>

      {/* Winner Card */}
      {winner && (
        <div className="bg-gradient-to-r from-primary to-violet-600 rounded-2xl p-5 mb-4 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {winner.bidder[0]}
            </div>
            <div>
              <p className="font-medium">{winner.bidder}</p>
              <p className="text-sm text-white/70">{winner.mode === 'team' ? 'Team bid' : 'Solo bid'} · Score: {winner.score}/100</p>
            </div>
            <span className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Winner</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-white/60 text-xs">Committed</p>
              <p className="font-medium">{winner.committedDate ? new Date(winner.committedDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">vs Expected</p>
              <p className="font-medium">{winner.daysVsExpected > 0 ? `${winner.daysVsExpected} days early` : winner.daysVsExpected < 0 ? `${Math.abs(winner.daysVsExpected)} days late` : 'On time'}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Score</p>
              <p className="font-medium">{winner.score} / 100</p>
            </div>
          </div>
          {winner.reasons && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-white/60 mb-1.5">Why this bid won:</p>
              <ul className="text-sm space-y-1">
                {winner.reasons.map((r, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-green-300 mt-0.5">✓</span>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* All Bids Comparison */}
      <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">All bids ({bids.length})</h3>
      <div className="space-y-3">
        {bids.map(bid => (
          <div key={bid.id} className={`bg-surface-container-lowest border rounded-2xl p-4 ${bid.isWinner ? 'border-primary/40 ring-1 ring-primary/10' : 'border-outline-variant/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium text-on-surface-variant">
                  {bid.bidder[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{bid.bidder}</p>
                  <p className="text-xs text-on-surface-variant">{bid.mode === 'team' ? 'Team' : 'Solo'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">{bid.score}/100</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  bid.status === 'Won' ? 'bg-green-50 text-green-700' : 'bg-surface-container-high text-on-surface-variant'
                }`}>{bid.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs mb-2">
              <div>
                <span className="text-on-surface-variant/60">Committed:</span>
                <span className="ml-1 text-on-surface">{bid.committedDate ? new Date(bid.committedDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant/60">vs Expected:</span>
                <span className={`ml-1 ${bid.daysVsExpected >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {bid.daysVsExpected > 0 ? `${bid.daysVsExpected}d early` : bid.daysVsExpected < 0 ? `${Math.abs(bid.daysVsExpected)}d late` : 'On time'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant/60">Within deadline:</span>
                <span className={`ml-1 ${bid.isWithinDeadline ? 'text-green-600' : 'text-red-600'}`}>{bid.isWithinDeadline ? 'Yes' : 'No'}</span>

              </div>
            </div>

            {bid.approach && <p className="text-xs text-on-surface-variant line-clamp-2">{bid.approach}</p>}

            {bid.reasons && bid.reasons.length > 0 && !bid.isWinner && (
              <div className="mt-2 pt-2">
                <ul className="text-xs text-on-surface-variant space-y-0.5">
                  {bid.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}

            {bid.teamMembers && bid.teamMembers.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {bid.teamMembers.map((m, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">{m.name}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {bids.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-on-surface-variant/60">No bids were placed on this idea</p>
        </div>
      )}
    </div>
  );
}
