import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

// ── helpers ──────────────────────────────────────────────────────────────────

function isLate(committedDate, expectedDate) {
  if (!committedDate || !expectedDate) return false;
  return new Date(committedDate) > new Date(expectedDate);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── sub-components ────────────────────────────────────────────────────────────

function IdeaBanner({ idea }) {
  const typeColors = {
    POC: 'bg-orange-100 text-orange-700',
    MVP: 'bg-teal-100 text-teal-700',
    Feature: 'bg-blue-100 text-blue-700',
  };
  const sizeColors = {
    Small: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-800',
    Large: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-3">{idea.title}</h1>

      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
        {/* category */}
        {idea.category && (
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
            {idea.category}
          </span>
        )}

        {/* type badge */}
        {idea.projectType && (
          <span className={`px-2.5 py-0.5 rounded-full font-medium ${typeColors[idea.projectType] ?? 'bg-gray-100 text-gray-700'}`}>
            {idea.projectType}
          </span>
        )}

        {/* size/points badge */}
        {idea.size && (
          <span className={`px-2.5 py-0.5 rounded-full font-medium ${sizeColors[idea.size] ?? 'bg-gray-100 text-gray-700'}`}>
            {idea.size}
            {idea.points ? ` · ${idea.points} pts` : ''}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {(idea.ownerName || idea.owner?.name || idea.owner?.email) && (
          <span>
            <span className="font-medium text-gray-600">Owner: </span>
            {idea.ownerName ?? idea.owner?.name ?? idea.owner?.email}
          </span>
        )}
        {idea.expectedDeliveryDate && (
          <span>
            <span className="font-medium text-gray-600">Expected delivery: </span>
            {fmtDate(idea.expectedDeliveryDate)}
          </span>
        )}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex gap-3 mb-1">
      {[
        { key: 'solo', label: 'Solo bid', desc: 'You build this alone. Full points awarded to you.' },
        { key: 'team', label: 'Team bid', desc: 'Build with others. Points split equally among members.' },
      ].map(({ key, label, desc }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition
            ${mode === key
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 bg-white hover:border-indigo-300'}`}
        >
          <p className={`text-sm font-semibold ${mode === key ? 'text-indigo-700' : 'text-gray-700'}`}>
            {label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </button>
      ))}
    </div>
  );
}

function LateWarning({ show, justification, onJustificationChange }) {
  if (!show) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
      <p className="text-sm font-medium text-amber-800">
        Your delivery date exceeds the idea's expected delivery date.
      </p>
      <div>
        <label className="block text-xs font-medium text-amber-800 mb-1">
          Justification <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(min 20 characters)</span>
        </label>
        <textarea
          required
          minLength={20}
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          rows={3}
          placeholder="Explain why this delivery date is realistic despite being later than expected..."
          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>
    </div>
  );
}

function UserSearchInput({ currentUserEmail, teamMembers, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // load all users once
  useEffect(() => {
    setLoadingUsers(true);
    api.get('/users')
      .then(({ data }) => setAllUsers(Array.isArray(data) ? data : data.users ?? []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return; }
    const q = query.toLowerCase();
    const filtered = allUsers.filter((u) => {
      const email = u.email ?? '';
      const name = u.name ?? u.displayName ?? '';
      return (
        email !== currentUserEmail &&
        !teamMembers.includes(email) &&
        (email.toLowerCase().includes(q) || name.toLowerCase().includes(q))
      );
    });
    setSuggestions(filtered.slice(0, 8));
    setOpen(filtered.length > 0);
  }, [query, allUsers, teamMembers, currentUserEmail]);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (user) => {
    onAdd(user.email);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) select(suggestions[0]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Team members
      </label>

      {/* chips */}
      {teamMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {teamMembers.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-medium"
            >
              {email}
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="ml-0.5 hover:text-red-500 font-bold leading-none"
                aria-label={`Remove ${email}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* search input */}
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && open && setOpen(true)}
          placeholder={loadingUsers ? 'Loading users…' : 'Search by name or email…'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(u); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition"
                >
                  <span className="font-medium text-gray-800">{u.name ?? u.displayName ?? u.email}</span>
                  {u.name && (
                    <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PlaceBid() {
  const { id: ideaId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [mode, setMode] = useState('solo');
  const [teamMembers, setTeamMembers] = useState([]); // array of emails
  const [committedDate, setCommittedDate] = useState('');
  const [justification, setJustification] = useState('');
  const [approach, setApproach] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/ideas/${ideaId}`)
      .then(({ data }) => setIdea(data))
      .catch(() => setIdea(null))
      .finally(() => setLoading(false));
  }, [ideaId]);

  const late = isLate(committedDate, idea?.expectedDeliveryDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (late && justification.trim().length < 20) {
      setError('Justification must be at least 20 characters when delivery date exceeds the expected date.');
      return;
    }
    if (!approach.trim()) {
      setError('Please provide an approach note.');
      return;
    }

    const body = {
      mode,
      committedDeliveryDate: new Date(committedDate).toISOString(),
      approach: approach.trim(),
      ...(late ? { lateJustification: justification.trim() } : {}),
      ...(mode === 'team' ? { teamMembers } : {}),
    };

    setSubmitting(true);
    try {
      await api.post(`/ideas/${ideaId}/bids`, body);
      navigate('/my-bids');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!idea) return (
    <div className="flex items-center justify-center py-24 text-gray-500">
      Idea not found.
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <IdeaBanner idea={idea} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* ── mode toggle ── */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Bid type</p>
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setTeamMembers([]); }} />
        </div>

        {/* ── team-only: lead + members ── */}
        {mode === 'team' && (
          <div className="space-y-4">
            {/* team lead (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team lead</label>
              <input
                type="text"
                readOnly
                value={user?.name ? `${user.name} (${user.email})` : (user?.email ?? '—')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* searchable team member input */}
            <UserSearchInput
              currentUserEmail={user?.email ?? ''}
              teamMembers={teamMembers}
              onAdd={(email) => setTeamMembers((prev) => prev.includes(email) ? prev : [...prev, email])}
              onRemove={(email) => setTeamMembers((prev) => prev.filter((e) => e !== email))}
            />
          </div>
        )}

        {/* ── delivery date ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Realistic delivery date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={committedDate}
            onChange={(e) => setCommittedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {idea.expectedDeliveryDate && (
            <p className="text-xs text-gray-400 mt-1">
              Idea expects delivery by {fmtDate(idea.expectedDeliveryDate)}
            </p>
          )}
        </div>

        {/* ── late warning + justification ── */}
        <LateWarning
          show={late}
          justification={justification}
          onJustificationChange={setJustification}
        />

        {/* ── approach note ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Approach note <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            rows={4}
            placeholder="Describe how you plan to build this…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {/* ── error message ── */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* ── submit button ── */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Submitting…'
            : mode === 'solo'
              ? 'Submit solo bid'
              : 'Send confirmation to team members'}
        </button>
      </form>
    </div>
  );
}
