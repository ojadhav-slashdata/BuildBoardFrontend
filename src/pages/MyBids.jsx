import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_STYLES = {
  Pending:       'bg-yellow-100 text-yellow-800 border-yellow-200',
  Won:           'bg-green-100  text-green-800  border-green-200',
  Active:        'bg-blue-100   text-blue-800   border-blue-200',
  'Not Selected':'bg-gray-100   text-gray-600   border-gray-200',
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}

function ModeBadge({ mode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
      ${mode === 'team'
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}
    >
      {mode === 'team' ? (
        <>
          {/* people icon */}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M15 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Team
        </>
      ) : (
        <>
          {/* single person icon */}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Solo
        </>
      )}
    </span>
  );
}

// ── bid card ──────────────────────────────────────────────────────────────────

function BidCard({ bid, onConfirm, onDecline }) {
  const [acting, setActing] = useState(false);

  const handleConfirm = async () => {
    setActing(true);
    await onConfirm(bid._id);
    setActing(false);
  };

  const handleDecline = async () => {
    setActing(true);
    await onDecline(bid._id);
    setActing(false);
  };

  const isPendingTeam = bid.mode === 'team' && bid.confirmationStatus === 'Pending';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">

      {/* top row: title + status */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-gray-900 text-base leading-snug flex-1">
          {bid.ideaTitle ?? bid.idea?.title ?? 'Untitled idea'}
        </h2>
        <StatusBadge status={bid.status ?? 'Pending'} />
      </div>

      {/* meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <ModeBadge mode={bid.mode} />
        <span className="text-gray-300">|</span>
        <span>
          Delivery: <span className="font-medium text-gray-700">{fmtDate(bid.committedDeliveryDate)}</span>
        </span>
        {bid.mode === 'team' && bid.confirmationStatus && bid.confirmationStatus !== 'Pending' && (
          <>
            <span className="text-gray-300">|</span>
            <span
              className={`font-medium ${bid.confirmationStatus === 'Confirmed' ? 'text-green-600' : 'text-red-500'}`}
            >
              {bid.confirmationStatus}
            </span>
          </>
        )}
      </div>

      {/* approach note */}
      {bid.approach && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed line-clamp-3">
          {bid.approach}
        </p>
      )}

      {/* confirm / decline buttons for pending team member */}
      {isPendingTeam && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConfirm}
            disabled={acting}
            className="flex-1 text-sm font-medium bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {acting ? 'Please wait…' : 'Confirm'}
          </button>
          <button
            onClick={handleDecline}
            disabled={acting}
            className="flex-1 text-sm font-medium bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {acting ? 'Please wait…' : 'Decline'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    api.get('/bids/mine')
      .then(({ data }) => setBids(Array.isArray(data) ? data : data.bids ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateBidLocal = (id, patch) =>
    setBids((prev) => prev.map((b) => (b._id === id ? { ...b, ...patch } : b)));

  const handleConfirm = async (id) => {
    setActionError('');
    try {
      await api.patch(`/bids/${id}/confirm`);
      updateBidLocal(id, { confirmationStatus: 'Confirmed' });
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Failed to confirm bid.');
    }
  };

  const handleDecline = async (id) => {
    setActionError('');
    try {
      await api.patch(`/bids/${id}/decline`);
      updateBidLocal(id, { confirmationStatus: 'Declined' });
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Failed to decline bid.');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (bids.length === 0) {
    return (
      <EmptyState
        message="You haven't placed any bids yet."
        icon="🎯"
      />
    );
  }

  // group by status for better UX: pending first, then active/won, then not selected
  const order = ['Pending', 'Active', 'Won', 'Not Selected'];
  const sorted = [...bids].sort((a, b) => {
    const ai = order.indexOf(a.status ?? 'Pending');
    const bi = order.indexOf(b.status ?? 'Pending');
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
        <span className="text-sm text-gray-400">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
      </div>

      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((bid) => (
          <BidCard
            key={bid._id}
            bid={bid}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
          />
        ))}
      </div>
    </div>
  );
}
