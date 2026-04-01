import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function BidReview() {
  const { ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/ideas/${ideaId}`), api.get(`/ideas/${ideaId}/bids`)])
      .then(([i, b]) => {
        setIdea(i.data);
        setBids(b.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ideaId]);

  const assignBid = async (bidId) => {
    try {
      await api.patch(`/bids/${bidId}/assign`);
      setBids((list) => list.map((b) => ({ ...b, status: b._id === bidId ? 'Won' : 'Not Selected' })));
    } catch {
      alert('Failed to assign bid.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!idea) return <p className="text-center text-on-surface-variant py-12">Idea not found.</p>;

  const now = new Date();
  const cutoff = idea.bidCutoffDate ? new Date(idea.bidCutoffDate) : null;
  const cutoffPassed = cutoff && now > cutoff;
  const expected = idea.expectedDeliveryDate ? new Date(idea.expectedDeliveryDate) : null;

  // Sort: recommended first (highest performanceScore, within deadline)
  const sorted = [...bids].sort((a, b) => {
    const aOver = expected && new Date(a.committedDeliveryDate) > expected;
    const bOver = expected && new Date(b.committedDeliveryDate) > expected;
    if (aOver && !bOver) return 1;
    if (!aOver && bOver) return -1;
    return (b.performanceScore || 0) - (a.performanceScore || 0);
  });

  const recommended = sorted.find(
    (b) => !expected || new Date(b.committedDeliveryDate) <= expected,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface mb-2">Bid Review — {idea.title}</h1>

      {/* Info Banner */}
      <div className="surface-card p-4 mb-6 flex items-center justify-between">
        <div className="text-sm text-on-surface-variant">
          Bid cutoff: {cutoff ? cutoff.toLocaleDateString() : 'N/A'}{' '}
          {cutoffPassed ? <span className="text-red-600 font-medium">(Closed)</span> : <span className="text-green-600 font-medium">(Open)</span>}
        </div>
        <div className="text-sm text-on-surface-variant">{bids.length} bid{bids.length !== 1 && 's'} received</div>
      </div>

      {bids.length === 0 ? (
        <EmptyState message="No bids received yet." icon="📭" />
      ) : (
        <div className="space-y-4">
          {sorted.map((bid) => {
            const isRecommended = bid._id === recommended?._id;
            const overDeadline = expected && new Date(bid.committedDeliveryDate) > expected;

            return (
              <div
                key={bid._id}
                className={`bg-surface-container-lowest rounded-2xl shadow-tonal p-5 border-2 transition ${
                  isRecommended ? 'border-purple-400' : overDeadline ? 'border-outline-variant/20 opacity-60' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-on-surface">{bid.bidderName || 'Bidder'}</span>
                    {isRecommended && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Recommended</span>}
                    {overDeadline && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Over deadline</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">{bid.mode === 'team' ? 'Team' : 'Solo'}</span>
                  </div>
                  <button
                    onClick={() => assignBid(bid._id)}
                    disabled={overDeadline || bid.status === 'Won'}
                    className={`text-sm px-4 py-1.5 rounded-full font-medium transition ${
                      bid.status === 'Won'
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : overDeadline
                          ? 'bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary to-primary-container text-white hover:bg-primary'
                    }`}
                  >
                    {bid.status === 'Won' ? 'Assigned' : 'Assign'}
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Committed: {new Date(bid.committedDeliveryDate).toLocaleDateString()}
                  {bid.performanceScore != null && ` · Score: ${bid.performanceScore}`}
                </p>
                {bid.approach && <p className="text-sm text-on-surface-variant mt-1">{bid.approach}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
