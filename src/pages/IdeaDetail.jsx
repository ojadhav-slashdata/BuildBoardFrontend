import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../axiosConfig';

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

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/ideas/${id}/complete`);
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
    } catch { alert('Failed to submit'); }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading...</div>;
  if (!idea) return <div className="text-center py-20 text-gray-400">Idea not found</div>;

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
      <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline mb-3">← Back</button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-lg font-medium text-gray-900">{idea.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{idea.category} · Owner: {idea.projectOwner || 'Not set'}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${idea.projectType === 'FullProduct' ? 'bg-teal-50 text-teal-700' : 'bg-indigo-50 text-indigo-600'}`}>
              {idea.projectType === 'FullProduct' ? 'Full product' : 'POC'}
            </span>
            {idea.size && <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{idea.size}</span>}
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColors[idea.status] || 'bg-gray-100 text-gray-600'}`}>
              {idea.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{idea.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          {idea.expectedDeliveryDate && <div><p className="text-xs text-gray-400">Expected delivery</p><p className="text-sm font-medium">{new Date(idea.expectedDeliveryDate).toLocaleDateString()}</p></div>}
          {idea.bidCutoffDate && <div><p className="text-xs text-gray-400">Bid cutoff</p><p className="text-sm font-medium">{new Date(idea.bidCutoffDate).toLocaleDateString()}</p></div>}
          <div><p className="text-xs text-gray-400">Hours logged</p><p className="text-sm font-medium">{totalHours} hrs</p></div>
          {idea.pointsReward > 0 && <div><p className="text-xs text-gray-400">Points</p><p className="text-sm font-medium text-indigo-600">+{idea.pointsReward} pts</p></div>}
        </div>
      </div>

      {/* Team Members */}
      {idea.teamMembers && idea.teamMembers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Team members</h3>
          <div className="flex gap-3 flex-wrap">
            {idea.teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                {m.pictureUrl ? <img src={m.pictureUrl} className="w-7 h-7 rounded-full" alt="" /> :
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">{(m.name||'?')[0]}</div>}
                <span className="text-sm text-gray-700">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hours Burndown */}
      {idea.status === 'InProgress' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Hours progress</h3>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{totalHours} hrs logged</span>
            <span>~{expectedHours} hrs expected</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (totalHours / expectedHours) * 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{Math.round((totalHours / expectedHours) * 100)}% of expected hours</p>
        </div>
      )}

      {/* Log Hours (only for in-progress members) */}
      {idea.status === 'InProgress' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Log today's hours</h3>
          <div className="grid grid-cols-[80px_1fr_auto] gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hours</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.5" max="24" step="0.5"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">What did you work on?</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Brief description..."
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
            </div>
            <button onClick={logHours} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition disabled:opacity-50">Log</button>
          </div>
        </div>
      )}

      {/* Builder Actions */}
      {idea.status === 'InProgress' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">Ready to submit?</p>
            <p className="text-xs text-indigo-600">Mark this project as complete for manager review</p>
          </div>
          <button onClick={submitForReview} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-800 transition">Submit for review</button>
        </div>
      )}

      {/* Bid Results link */}
      {(idea.status === 'InProgress' || idea.status === 'Completed') && (
        <Link to={`/ideas/${id}/results`} className="block bg-white border border-gray-200 rounded-xl p-4 mb-4 hover:border-indigo-200 transition">
          <p className="text-sm font-medium text-indigo-600">View bid results & scoring →</p>
          <p className="text-xs text-gray-500">See how bids were ranked and why the winner was selected</p>
        </Link>
      )}

      {/* Time Logs */}
      {idea.timeLogs && idea.timeLogs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Time log</h3>
          <div className="space-y-2">
            {idea.timeLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20">{log.date}</span>
                  <span className="text-sm text-gray-700">{log.userName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{log.hours} hrs</span>
                  <span className="text-xs text-gray-400 max-w-[200px] truncate">{log.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Comments & clarifications</h3>
        <div className="flex gap-2 mb-4">
          <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
            onKeyDown={e => e.key === 'Enter' && postComment()} />
          <button onClick={postComment} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition disabled:opacity-50">Post</button>
        </div>
        {idea.comments && idea.comments.length > 0 ? (
          <div className="space-y-3">
            {idea.comments.map((c, i) => (
              <div key={i} className="flex gap-3">
                {c.pictureUrl ? <img src={c.pictureUrl} className="w-7 h-7 rounded-full mt-0.5" alt="" /> :
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 mt-0.5">{(c.userName||'?')[0]}</div>}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{c.userName}</span>
                    <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No comments yet</p>}
      </div>

      {/* Feedback */}
      {idea.feedback && idea.feedback.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Manager feedback</h3>
          {idea.feedback.map((f, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                f.rating === 'Excellent' ? 'bg-green-50 text-green-700' :
                f.rating === 'Good' ? 'bg-blue-50 text-blue-700' :
                f.rating === 'Average' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
              }`}>{f.rating}</span>
              {f.comment && <p className="text-sm text-gray-600 mt-2 italic">"{f.comment}"</p>}
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
        <Link to={`/ideas/${id}/bid`} className="block bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 hover:border-indigo-300 transition text-center">
          <p className="text-sm font-medium text-indigo-700">Place a bid on this idea →</p>
        </Link>
      )}
    </div>
  );
}
