import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../axiosConfig';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function IdeaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [tab, setTab] = useState('requirements');
  const [timeLogs, setTimeLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [logForm, setLogForm] = useState({ hours: '', notes: '' });
  const [showLogForm, setShowLogForm] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    api.get(`/ideas/${id}`)
      .then(({ data }) => {
        setIdea(data);
        setTimeLogs(data.timeLogs || []);
        setComments(data.comments || []);
      })
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const submitTimeLog = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/ideas/${id}/timelogs`, {
        hours: Number(logForm.hours),
        notes: logForm.notes,
      });
      setTimeLogs((t) => [...t, data]);
      setLogForm({ hours: '', notes: '' });
      setShowLogForm(false);
    } catch {
      alert('Failed to log time.');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/ideas/${id}/comments`, { text: commentText });
      setComments((c) => [...c, data]);
      setCommentText('');
    } catch {
      alert('Failed to post comment.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (forbidden) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🚫</p>
        <p className="text-xl font-semibold text-gray-700">403 — Access Denied</p>
        <p className="text-gray-500 mt-2">You are not a member of this project.</p>
      </div>
    );
  }
  if (!idea) return <p className="text-center text-gray-500 py-12">Idea not found.</p>;

  const hoursLogged = timeLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const hoursEstimated = idea.estimatedHours || 1;
  const progressPct = Math.min(100, Math.round((hoursLogged / hoursEstimated) * 100));

  const tabs = ['requirements', 'timelog', 'comments'];

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-xl font-bold">{idea.title}</h1>
          <StatusBadge status={idea.status} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${idea.projectType === 'POC' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>{idea.projectType}</span>
          {idea.size && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{idea.size}</span>}
        </div>
        {idea.expectedDeliveryDate && <p className="text-sm text-gray-500 mb-3">Due: {new Date(idea.expectedDeliveryDate).toLocaleDateString()}</p>}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Hours logged: {hoursLogged} / {hoursEstimated}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Team */}
        <div className="flex items-center gap-3 flex-wrap">
          {idea.teamMembers?.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {m.pictureUrl ? (
                <img src={m.pictureUrl} className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" alt="" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{(m.name || '?')[0]}</span>
              )}
              <span className="text-xs text-gray-600">{m.name}</span>
            </div>
          ))}
          {idea.projectOwner && <span className="text-xs text-gray-500">Owner: {idea.projectOwner}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {t === 'timelog' ? 'Time Log' : t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {tab === 'requirements' && (
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{idea.description || 'No requirements yet.'}</div>
        )}

        {tab === 'timelog' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Time Entries</h3>
              <button onClick={() => setShowLogForm((v) => !v)} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition">
                {showLogForm ? 'Cancel' : 'Log today'}
              </button>
            </div>
            {showLogForm && (
              <form onSubmit={submitTimeLog} className="flex gap-3 mb-4">
                <input type="number" required min="0.25" step="0.25" placeholder="Hours" value={logForm.hours} onChange={(e) => setLogForm((f) => ({ ...f, hours: e.target.value }))} className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="text" placeholder="Notes" value={logForm.notes} onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
              </form>
            )}
            {timeLogs.length === 0 ? (
              <p className="text-sm text-gray-400">No entries yet.</p>
            ) : (
              <div className="divide-y">
                {timeLogs.map((log, i) => (
                  <div key={i} className="py-2 flex justify-between text-sm">
                    <div>
                      <span className="text-gray-700 font-medium">{log.userName || 'You'}</span>
                      {log.notes && <span className="text-gray-500 ml-2">— {log.notes}</span>}
                    </div>
                    <div className="text-gray-500">
                      {log.hours}h &middot; {log.date ? new Date(log.date).toLocaleDateString() : 'Today'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div>
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 mb-4">No comments yet. Start the conversation!</p>
            ) : (
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    {c.pictureUrl ? (
                      <img src={c.pictureUrl} className="h-8 w-8 rounded-full mt-0.5" referrerPolicy="no-referrer" alt="" />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">{(c.userName || '?')[0]}</span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{c.userName || 'User'}</span>
                        <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={submitComment} className="flex gap-2">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
