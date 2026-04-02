import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_STYLES = {
  Pending:       'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  Won:           'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  Active:        'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  'Not Selected':'bg-surface-container-high text-on-surface-variant',
};

function StatusBadgeLocal({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function ModeBadge({ mode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${mode === 'team' ? 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20' : 'bg-surface-container-high text-on-surface-variant'}`}>
      <span className="material-symbols-outlined text-[14px]">{mode === 'team' ? 'group' : 'person'}</span>
      {mode === 'team' ? 'Team' : 'Solo'}
    </span>
  );
}

function BidCard({ bid, onConfirm, onDecline, editingBid, editDate, editApproach, editSaving, onStartEdit, onEditDateChange, onEditApproachChange, onSaveEdit, onCancelEdit }) {
  const [acting, setActing] = useState(false);

  const handleConfirm = async () => { setActing(true); await onConfirm(bid._id); setActing(false); };
  const handleDecline = async () => { setActing(true); await onDecline(bid._id); setActing(false); };

  const isPendingTeam = bid.mode === 'team' && bid.confirmationStatus === 'Pending';
  const bidId = bid._id || bid.id;
  const isEditing = editingBid === bidId;

  return (
    <div className="surface-card p-5 flex flex-col gap-3 hover:shadow-tonal-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-on-surface text-base leading-snug flex-1">
          {bid.ideaTitle ?? bid.idea?.title ?? 'Untitled idea'}
        </h2>
        <StatusBadgeLocal status={bid.status ?? 'Pending'} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
        <ModeBadge mode={bid.mode} />
        <span>Delivery: <span className="font-medium text-on-surface">{fmtDate(bid.committedDeliveryDate)}</span></span>
        {bid.mode === 'team' && bid.confirmationStatus && bid.confirmationStatus !== 'Pending' && (
          <span className={`font-medium ${bid.confirmationStatus === 'Confirmed' ? 'text-emerald-600' : 'text-red-500'}`}>
            {bid.confirmationStatus}
          </span>
        )}
      </div>

      {bid.approach && (
        <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-3 leading-relaxed line-clamp-3">{bid.approach}</p>
      )}

      {isPendingTeam && (
        <div className="flex gap-2 pt-1">
          <button onClick={handleConfirm} disabled={acting} className="flex-1 text-sm font-semibold bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-full hover:bg-emerald-100 transition disabled:opacity-50">
            {acting ? 'Please wait...' : 'Confirm'}
          </button>
          <button onClick={handleDecline} disabled={acting} className="flex-1 text-sm font-semibold bg-red-50 text-red-600 px-4 py-2.5 rounded-full hover:bg-red-100 transition disabled:opacity-50">
            {acting ? 'Please wait...' : 'Decline'}
          </button>
        </div>
      )}

      {bid.status === 'Pending' && isEditing ? (
        <div className="mt-4 pt-4 border-t border-outline-variant/10 space-y-3">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">Delivery date</label>
            <div className="relative">
              <input type="date" value={editDate} onChange={e => onEditDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer" />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-lg">calendar_month</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">Approach</label>
            <textarea value={editApproach} onChange={e => onEditApproachChange(e.target.value)} rows={3}
              className="input-field w-full resize-y min-h-[60px] text-sm" placeholder="Your approach..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSaveEdit(bid)} disabled={editSaving}
              className="btn-primary px-4 py-2 text-xs disabled:opacity-50">
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={onCancelEdit}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition">
              Cancel
            </button>
          </div>
        </div>
      ) : bid.status === 'Pending' && (
        <button onClick={() => onStartEdit(bid)}
          className="mt-3 text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit bid
        </button>
      )}
    </div>
  );
}

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [editingBid, setEditingBid] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editApproach, setEditApproach] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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
    try { await api.patch(`/bids/${id}/confirm`); updateBidLocal(id, { confirmationStatus: 'Confirmed' }); }
    catch (err) { setActionError(err?.response?.data?.message ?? 'Failed to confirm bid.'); }
  };

  const handleDecline = async (id) => {
    setActionError('');
    try { await api.patch(`/bids/${id}/decline`); updateBidLocal(id, { confirmationStatus: 'Declined' }); }
    catch (err) { setActionError(err?.response?.data?.message ?? 'Failed to decline bid.'); }
  };

  const handleEditBid = async (bid) => {
    setEditSaving(true);
    try {
      await api.patch(`/ideas/${bid.idea}/bids/${bid._id || bid.id}`, {
        committedDeliveryDate: editDate || undefined,
        approach: editApproach || undefined,
      });
      setEditingBid(null);
      // Refresh bids
      const res = await api.get('/bids/mine');
      setBids(res.data?.bids || res.data || []);
    } catch { alert('Failed to update bid'); }
    setEditSaving(false);
  };

  const startEdit = (bid) => {
    setEditingBid(bid._id || bid.id);
    setEditDate(bid.committedDeliveryDate ? new Date(bid.committedDeliveryDate).toISOString().split('T')[0] : '');
    setEditApproach(bid.approach || '');
  };

  if (loading) return <LoadingSpinner />;
  if (bids.length === 0) return <EmptyState message="You haven't placed any bids yet." icon="🎯" />;

  const order = ['Pending', 'Active', 'Won', 'Not Selected'];
  const sorted = [...bids].sort((a, b) => {
    const ai = order.indexOf(a.status ?? 'Pending');
    const bi = order.indexOf(b.status ?? 'Pending');
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-heading text-2xl">My Bids</h1>
        <span className="text-sm text-on-surface-variant/50">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
      </div>

      {actionError && (
        <div className="mb-4 text-sm text-error bg-error-container/50 rounded-xl px-4 py-3">{actionError}</div>
      )}

      <div className="space-y-4">
        {sorted.map((bid) => (
          <BidCard
            key={bid._id}
            bid={bid}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
            editingBid={editingBid}
            editDate={editDate}
            editApproach={editApproach}
            editSaving={editSaving}
            onStartEdit={startEdit}
            onEditDateChange={setEditDate}
            onEditApproachChange={setEditApproach}
            onSaveEdit={handleEditBid}
            onCancelEdit={() => setEditingBid(null)}
          />
        ))}
      </div>
    </div>
  );
}
