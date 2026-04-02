import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../axiosConfig';

const STATUS_LABELS = {
  BiddingOpen: 'Open for Bidding',
  InProgress: 'In Progress',
  PendingApproval: 'Pending Review',
  Completed: 'Completed',
  Rejected: 'Rejected',
  Draft: 'Draft',
  BiddingClosed: 'Bidding Closed',
  Assigned: 'Assigned',
};

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(2);
  const [notes, setNotes] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    api.get(`/ideas/${id}`).then(res => setIdea(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const logHours = async () => {
    setSubmitting(true);
    try {
      await api.post(`/ideas/${id}/timelogs`, { hours: Number(hours), notes });
      setNotes(''); setHours(2);
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
    } catch { alert('Failed to log hours'); }
    setSubmitting(false);
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/ideas/${id}/comments`, { text: comment });
      setComment('');
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
    } catch { alert('Failed to post comment'); }
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      await api.patch(`/ideas/${id}/edit`, editForm);
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
      setEditing(false);
    } catch { alert('Failed to save'); }
    setEditSaving(false);
  };

  const startEditing = () => {
    setEditing(true);
    setEditForm({
      size: idea.size || '',
      complexity: idea.complexity || '',
      bidCutoffDate: idea.bidCutoffDate ? new Date(idea.bidCutoffDate).toISOString().split('T')[0] : '',
      expectedDeliveryDate: idea.expectedDeliveryDate ? new Date(idea.expectedDeliveryDate).toISOString().split('T')[0] : '',
      projectOwner: idea.projectOwner || '',
    });
  };

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/ideas/${id}/complete`);
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
    } catch { alert('Failed to submit'); }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant/60">Loading...</div>;
  if (!idea) return <div className="text-center py-20 text-on-surface-variant/60">Idea not found</div>;

  const statusColors = {
    BiddingOpen: 'bg-green-50 text-green-700',
    InProgress: 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    PendingApproval: 'bg-blue-50 text-blue-700',
    Rejected: 'bg-red-50 text-red-700',
    Expired: 'bg-orange-50 text-orange-700',
  };

  const isMember = idea.teamMembers?.some(m => m.id === user?.id);
  const totalHours = idea.timeLogs?.reduce((s, l) => s + l.hours, 0) || 0;
  const expectedHours = idea.estimatedHours || idea.actualHours || 100;
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline mb-3">← Back</button>

      {/* Header */}
      <div className="surface-card p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-lg font-medium font-manrope tracking-tight text-on-surface">{idea.title}</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {idea.category}
              {idea.projectOwner && <> · Owner: {idea.projectOwner}</>}
              {idea.submittedByName && <> · Submitted by: {idea.submittedByName}</>}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${idea.projectType === 'FullProduct' ? 'bg-teal-50 text-teal-700' : 'bg-primary/10 text-primary'}`}>
              {idea.projectType === 'FullProduct' ? 'Full product' : 'POC'}
            </span>
            {idea.size && <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">{idea.size}</span>}
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColors[idea.status] || 'bg-surface-container-high text-on-surface-variant'}`}>
              {STATUS_LABELS[idea.status] || idea.status}
            </span>
            {isAdmin && ['BiddingOpen', 'InProgress', 'Approved'].includes(idea.status) && !editing && (
              <button onClick={startEditing} className="p-2 rounded-xl hover:bg-surface-container-high/50 transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-on-surface-variant leading-relaxed">{idea.description}</p>

        {/* Business Value Tags */}
        {idea.businessValue && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {idea.businessValue.split(',').map((tag, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Resources & Challenges */}
        {idea.resources && (
          <div className="mt-4 p-3 bg-surface-container-low rounded-lg">
            <p className="text-xs font-semibold text-on-surface-variant mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">group</span>
              Resources & Stakeholders
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{idea.resources}</p>
          </div>
        )}
        {idea.challenges && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">warning</span>
              Known Challenges
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">{idea.challenges}</p>
          </div>
        )}

        {/* Rejection Comment */}
        {idea.status === 'Rejected' && idea.rejectionComment && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-800 leading-relaxed">"{idea.rejectionComment}"</p>
          </div>
        )}

        {/* Attachment */}
        {idea.attachmentUrl && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-surface-container-low rounded-xl">
            {idea.attachmentUrl.startsWith('data:image') ? (
              <img src={idea.attachmentUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">description</span>
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-on-surface">{idea.attachmentName || 'Attachment'}</p>
            </div>
            <a href={idea.attachmentUrl} target="_blank" rel="noopener noreferrer" download={idea.attachmentName}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">download</span>
              Download
            </a>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-outline-variant/10">
          {idea.createdAt && (
            <div>
              <p className="text-xs text-on-surface-variant/60">Submitted</p>
              <p className="text-sm font-medium">{new Date(idea.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          {idea.expectedDeliveryDate && (
            <div>
              <p className="text-xs text-on-surface-variant/60">Expected delivery</p>
              <p className="text-sm font-medium">{new Date(idea.expectedDeliveryDate).toLocaleDateString()}</p>
            </div>
          )}
          {idea.bidCutoffDate && (
            <div>
              <p className="text-xs text-on-surface-variant/60">Bid cutoff</p>
              <p className="text-sm font-medium">{new Date(idea.bidCutoffDate).toLocaleDateString()}</p>
            </div>
          )}
          {idea.complexity && (
            <div>
              <p className="text-xs text-on-surface-variant/60">Complexity</p>
              <p className="text-sm font-medium">{idea.complexity}</p>
            </div>
          )}
          {idea.minHours && idea.maxHours && (
            <div>
              <p className="text-xs text-on-surface-variant/60">Estimated hours</p>
              <p className="text-sm font-medium">{idea.minHours} – {idea.maxHours} hrs</p>
            </div>
          )}
          <div>
            <p className="text-xs text-on-surface-variant/60">Hours logged</p>
            <p className="text-sm font-medium">{totalHours} hrs</p>
          </div>
          {idea.pointsReward > 0 && (
            <div>
              <p className="text-xs text-on-surface-variant/60">Points</p>
              <p className="text-sm font-medium text-primary">+{idea.pointsReward} pts</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Action for Admins on PendingApproval ideas */}
      {idea.status === 'PendingApproval' && isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">rate_review</span>
              This idea needs your review
            </h3>
            <p className="text-xs text-blue-700 mt-0.5">Set size, complexity, dates and approve or reject this idea</p>
          </div>
          <button
            onClick={() => navigate(`/approvals?ideaId=${idea._id || idea.id}`)}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-sm font-bold hover:opacity-90 transition"
          >
            Review & Approve
          </button>
        </div>
      )}

      {editing && (
        <div className="surface-card-elevated p-5 mb-4">
          <h3 className="font-manrope font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">edit</span>
            Edit Idea Details
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">Size</label>
              <select value={editForm.size} onChange={e => setEditForm(f => ({...f, size: e.target.value}))} className="input-field w-full">
                {['Micro','Small','Medium','Large','XL','Enterprise'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">Complexity</label>
              <select value={editForm.complexity} onChange={e => setEditForm(f => ({...f, complexity: e.target.value}))} className="input-field w-full">
                {['Low','Medium','High','Innovative'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">Bid cutoff</label>
              <div className="relative">
                <input type="date" value={editForm.bidCutoffDate} onChange={e => setEditForm(f => ({...f, bidCutoffDate: e.target.value}))}
                  className="input-field w-full cursor-pointer" />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-lg">calendar_month</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">Expected delivery</label>
              <div className="relative">
                <input type="date" value={editForm.expectedDeliveryDate} onChange={e => setEditForm(f => ({...f, expectedDeliveryDate: e.target.value}))}
                  className="input-field w-full cursor-pointer" />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-lg">calendar_month</span>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">Project Owner</label>
            <input type="text" value={editForm.projectOwner} onChange={e => setEditForm(f => ({...f, projectOwner: e.target.value}))}
              className="input-field w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={editSaving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditing(false)} className="px-5 py-2 rounded-xl text-sm font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Team Members */}
      {idea.teamMembers && idea.teamMembers.length > 0 && (
        <div className="surface-card p-5 mb-4">
          <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Team members</h3>
          <div className="flex gap-3 flex-wrap">
            {idea.teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                {m.pictureUrl ? <img src={m.pictureUrl} className="w-7 h-7 rounded-full" alt="" referrerPolicy="no-referrer" /> :
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{(m.name||'?')[0]}</div>}
                <span className="text-sm text-on-surface">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hours Burndown */}
      {idea.status === 'InProgress' && (
        <div className="surface-card p-5 mb-4">
          <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Hours progress</h3>
          <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
            <span>{totalHours} hrs logged</span>
            <span>~{expectedHours} hrs expected</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (totalHours / expectedHours) * 100)}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant/60 mt-1">{Math.round((totalHours / expectedHours) * 100)}% of expected hours</p>
        </div>
      )}

      {/* Log Hours (only for in-progress members) */}
      {idea.status === 'InProgress' && (
        <div className="surface-card p-5 mb-4">
          <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Log today's hours</h3>
          <div className="grid grid-cols-[80px_1fr_auto] gap-3 items-end">
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Hours</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.5" max="24" step="0.5"
                className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">What did you work on?</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Brief description..."
                className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
            <button onClick={logHours} disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-container transition disabled:opacity-50">Log</button>
          </div>
        </div>
      )}

      {/* Builder Actions */}
      {idea.status === 'InProgress' && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Ready to submit?</p>
            <p className="text-xs text-primary">Mark this project as complete for manager review</p>
          </div>
          <button onClick={submitForReview} disabled={submitting} className="px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-xs font-medium hover:bg-primary transition">Submit for review</button>
        </div>
      )}

      {/* Bid Results link */}
      {(idea.status === 'InProgress' || idea.status === 'Completed') && (
        <Link to={`/ideas/${id}/results`} className="block surface-card p-4 mb-4 hover:border-primary/20 transition">
          <p className="text-sm font-medium text-primary">View bid results & scoring →</p>
          <p className="text-xs text-on-surface-variant">See how bids were ranked and why the winner was selected</p>
        </Link>
      )}

      {/* Time Logs */}
      {idea.timeLogs && idea.timeLogs.length > 0 && (
        <div className="surface-card p-5 mb-4">
          <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Time log</h3>
          <div className="space-y-2">
            {idea.timeLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant/60 w-20">{log.date}</span>
                  <span className="text-sm text-on-surface">{log.userName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-on-surface">{log.hours} hrs</span>
                  <span className="text-xs text-on-surface-variant/60 max-w-[200px] truncate">{log.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="surface-card p-5 mb-4">
        <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Comments & clarifications</h3>
        <div className="flex gap-2 mb-4">
          <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
            className="input-field flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && postComment()} />
          <button onClick={postComment} disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-container transition disabled:opacity-50">Post</button>
        </div>
        {idea.comments && idea.comments.length > 0 ? (
          <div className="space-y-3">
            {idea.comments.map((c, i) => (
              <div key={i} className="flex gap-3">
                {c.pictureUrl ? <img src={c.pictureUrl} className="w-7 h-7 rounded-full mt-0.5" alt="" referrerPolicy="no-referrer" /> :
                  <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-xs text-on-surface-variant mt-0.5">{(c.userName||'?')[0]}</div>}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface">{c.userName}</span>
                    <span className="text-xs text-on-surface-variant/60">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-on-surface-variant/60">No comments yet</p>}
      </div>

      {/* Feedback */}
      {idea.feedback && idea.feedback.length > 0 && (
        <div className="surface-card p-5 mb-4">
          <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Manager feedback</h3>
          {idea.feedback.map((f, i) => (
            <div key={i} className="bg-surface-container-low rounded-lg p-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                f.rating === 'Excellent' ? 'bg-green-50 text-green-700' :
                f.rating === 'Good' ? 'bg-blue-50 text-blue-700' :
                f.rating === 'Average' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
              }`}>{f.rating}</span>
              {f.comment && <p className="text-sm text-on-surface-variant mt-2 italic">"{f.comment}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Manager: Give Feedback */}
      {idea.status === 'Completed' && (user?.role === 'Manager' || user?.role === 'Admin') && (
        <Link to={`/ideas/${id}/feedback`} className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 hover:border-amber-300 transition">
          <p className="text-sm font-medium text-amber-800">Rate this delivery →</p>
          <p className="text-xs text-amber-600">Submit your rating and award points to the builder(s)</p>
        </Link>
      )}

      {/* Bidding Section */}
      {idea.status === 'BiddingOpen' && (
        <div className="surface-card-elevated rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-manrope font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                Place a Bid
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {idea.bidCutoffDate ? `Bidding closes ${new Date(idea.bidCutoffDate).toLocaleDateString()}` : 'Open for bidding'}
              </p>
            </div>
            {idea.bidCutoffDate && new Date(idea.bidCutoffDate).getTime() > 0 && new Date(idea.bidCutoffDate).getTime() < Date.now() ? (
              <span className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-medium ring-1 ring-inset ring-red-600/20">Bidding Closed</span>
            ) : (
              <Link to={`/ideas/${id}/bid`}
                className="btn-primary inline-flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">gavel</span>
                Place Bid
              </Link>
            )}
          </div>
        </div>
      )}
      {idea.status === 'Expired' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-orange-600">timer_off</span>
          <div>
            <p className="text-sm font-medium text-orange-800">This idea has expired</p>
            <p className="text-xs text-orange-600">The bidding period ended with no bids received.</p>
          </div>
        </div>
      )}
      {idea.status !== 'BiddingOpen' && !['InProgress','Completed','PendingApproval','Expired'].includes(idea.status) && (
        <div className="bg-surface-container-low rounded-2xl p-4 mb-4 text-center">
          <p className="text-sm text-on-surface-variant">This idea is not currently accepting bids</p>
        </div>
      )}
    </div>
  );
}
