import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../axiosConfig';
import { useToast } from '../context/ToastContext';

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(2);
  const [notes, setNotes] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch { showToast('Failed to log hours', 'error'); }
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
    } catch { showToast('Failed to post comment', 'error'); }
    setSubmitting(false);
  };

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/ideas/${id}/complete`);
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
    } catch { showToast('Failed to submit', 'error'); }
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
  };

  const isMember = idea.teamMembers?.some(m => m.id === user?.id);
  const totalHours = idea.timeLogs?.reduce((s, l) => s + l.hours, 0) || 0;
  const expectedHours = idea.estimatedHours || idea.actualHours || 100;

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline mb-3">← Back</button>

      {/* Header */}
      <div className="surface-card p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-lg font-medium font-manrope tracking-tight text-on-surface">{idea.title}</h1>
            <p className="text-sm text-on-surface-variant mt-1">{idea.category} · Owner: {idea.projectOwner || 'Not set'}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${idea.projectType === 'FullProduct' ? 'bg-teal-50 text-teal-700' : 'bg-primary/10 text-primary'}`}>
              {idea.projectType === 'FullProduct' ? 'Full product' : 'POC'}
            </span>
            {idea.size && <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">{idea.size}</span>}
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColors[idea.status] || 'bg-surface-container-high text-on-surface-variant'}`}>
              {idea.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{idea.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4">
          {idea.expectedDeliveryDate && <div><p className="text-xs text-on-surface-variant/60">Expected delivery</p><p className="text-sm font-medium">{new Date(idea.expectedDeliveryDate).toLocaleDateString()}</p></div>}
          {idea.bidCutoffDate && <div><p className="text-xs text-on-surface-variant/60">Bid cutoff</p><p className="text-sm font-medium">{new Date(idea.bidCutoffDate).toLocaleDateString()}</p></div>}
          <div><p className="text-xs text-on-surface-variant/60">Hours logged</p><p className="text-sm font-medium">{totalHours} hrs</p></div>
          {idea.pointsReward > 0 && <div><p className="text-xs text-on-surface-variant/60">Points</p><p className="text-sm font-medium text-primary">+{idea.pointsReward} pts</p></div>}
        </div>
      </div>

      {/* Team Members */}
      {idea.teamMembers && idea.teamMembers.length > 0 && (
        <div className="surface-card p-5 mb-4">
          <h3 className="text-sm font-medium font-manrope text-on-surface mb-3">Team members</h3>
          <div className="flex gap-3 flex-wrap">
            {idea.teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                {m.pictureUrl ? <img src={m.pictureUrl} className="w-7 h-7 rounded-full" alt="" /> :
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
                {c.pictureUrl ? <img src={c.pictureUrl} className="w-7 h-7 rounded-full mt-0.5" alt="" /> :
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

      {/* Place Bid */}
      {idea.status === 'BiddingOpen' && (
        <Link to={`/ideas/${id}/bid`} className="block bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 hover:border-primary/40 transition text-center">
          <p className="text-sm font-medium text-primary">Place a bid on this idea →</p>
        </Link>
      )}
    </div>
  );
}
