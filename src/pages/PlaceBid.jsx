import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from '../components/DatePicker';
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
    <div className="surface-card p-6 mb-6">
      <h1 className="text-xl font-bold font-manrope tracking-tight text-on-surface mb-3">{idea.title}</h1>

      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
        {/* category */}
        {idea.category && (
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
            {idea.category}
          </span>
        )}

        {/* type badge */}
        {idea.projectType && (
          <span className={`px-2.5 py-0.5 rounded-full font-medium ${typeColors[idea.projectType] ?? 'bg-surface-container-high text-on-surface'}`}>
            {idea.projectType}
          </span>
        )}

        {/* size/points badge */}
        {idea.size && (
          <span className={`px-2.5 py-0.5 rounded-full font-medium ${sizeColors[idea.size] ?? 'bg-surface-container-high text-on-surface'}`}>
            {idea.size}
            {idea.points ? ` · ${idea.points} pts` : ''}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
        {(idea.ownerName || idea.owner?.name || idea.owner?.email) && (
          <span>
            <span className="font-medium text-on-surface-variant">Owner: </span>
            {idea.ownerName ?? idea.owner?.name ?? idea.owner?.email}
          </span>
        )}
        {idea.expectedDeliveryDate && (
          <span>
            <span className="font-medium text-on-surface-variant">Expected delivery: </span>
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
          className={`flex-1 rounded-2xl border-2 px-4 py-3 text-left transition
            ${mode === key
              ? 'border-primary bg-primary/10'
              : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/40'}`}
        >
          <p className={`text-sm font-semibold ${mode === key ? 'text-primary' : 'text-on-surface'}`}>
            {label}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
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
          <span className="text-on-surface-variant/60 font-normal ml-1">(min 20 characters)</span>
        </label>
        <textarea
          required
          minLength={20}
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          rows={3}
          placeholder="Explain why this delivery date is realistic despite being later than expected..."
          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-surface-container-lowest"
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
      <label className="block text-sm font-medium text-on-surface mb-1">
        Team members
      </label>

      {/* chips */}
      {teamMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {teamMembers.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-xs font-medium"
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
          className="input-field w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-surface-container-lowest rounded-lg shadow-tonal-lg max-h-48 overflow-y-auto">
            {suggestions.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(u); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition"
                >
                  <span className="font-medium text-on-surface">{u.name ?? u.displayName ?? u.email}</span>
                  {u.name && (
                    <span className="ml-2 text-xs text-on-surface-variant/60">{u.email}</span>
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
  const [canBid, setCanBid] = useState(true);
  const [bidError, setBidError] = useState('');

  // form state
  const [mode, setMode] = useState('solo');
  const [teamMembers, setTeamMembers] = useState([]); // array of emails
  const [committedDate, setCommittedDate] = useState('');
  const [justification, setJustification] = useState('');
  const [approach, setApproach] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!idea?.bidCutoffDate) return;
    const update = () => {
      const diff = new Date(idea.bidCutoffDate) - new Date();
      setTimeLeft(diff > 0 ? diff : 0);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [idea]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/ideas/${ideaId}`);
        setIdea(res.data);

        // Check if can bid
        if (res.data.status !== 'BiddingOpen') {
          setCanBid(false);
          setBidError('This idea is not open for bidding');
        } else if (res.data.bidCutoffDate) {
          const cutoff = new Date(res.data.bidCutoffDate).getTime();
          const now = Date.now();
          if (cutoff > 0 && cutoff < now) {
            setCanBid(false);
            setBidError('Bidding deadline has passed');
          }
        }

        // Check if already bid
        try {
          const bidsRes = await api.get(`/ideas/${ideaId}/bids`);
          const myBid = (bidsRes.data.bids || bidsRes.data || []).find(b => b.bidder === user?.id);
          if (myBid) { setCanBid(false); setBidError('You have already placed a bid on this idea'); }
        } catch {}
      } catch {
        setIdea(null);
      } finally {
        setLoading(false);
      }
    })();
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
    <div className="flex items-center justify-center py-24 text-on-surface-variant">
      Idea not found.
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <IdeaBanner idea={idea} />

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">

        {/* ── bid cutoff countdown ── */}
        {timeLeft !== null && (
          <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between ${
            timeLeft < 3600000 ? 'bg-error/10 border border-error/20' :
            timeLeft < 86400000 ? 'bg-amber-50 border border-amber-200' :
            'bg-surface-container-low border border-outline-variant/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${timeLeft < 3600000 ? 'text-error' : timeLeft < 86400000 ? 'text-amber-600' : 'text-on-surface-variant'}`}>timer</span>
              <span className={`text-sm font-medium ${timeLeft < 3600000 ? 'text-error' : timeLeft < 86400000 ? 'text-amber-700' : 'text-on-surface-variant'}`}>
                {timeLeft < 3600000 ? 'Bidding closes very soon!' :
                 timeLeft < 86400000 ? 'Bidding closes soon' : 'Time remaining to bid'}
              </span>
            </div>
            <span className={`text-sm font-bold ${timeLeft < 3600000 ? 'text-error' : timeLeft < 86400000 ? 'text-amber-700' : 'text-primary'}`}>
              {timeLeft <= 0 ? 'Closed' :
               timeLeft < 3600000 ? `${Math.floor(timeLeft/60000)} mins` :
               timeLeft < 86400000 ? `${Math.floor(timeLeft/3600000)}h ${Math.floor((timeLeft%3600000)/60000)}m` :
               `${Math.floor(timeLeft/86400000)}d ${Math.floor((timeLeft%86400000)/3600000)}h`}
            </span>
          </div>
        )}

        {/* ── bid validation error ── */}
        {!canBid && (
          <div className="bg-error/10 border border-error/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-error">block</span>
            <p className="text-sm font-medium text-error">{bidError}</p>
          </div>
        )}

        {/* ── mode toggle ── */}
        <div>
          <p className="text-sm font-semibold text-on-surface mb-2">Bid type</p>
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setTeamMembers([]); }} />
        </div>

        {/* ── team-only: lead + members ── */}
        {mode === 'team' && (
          <div className="space-y-4">
            {/* team lead (read-only) */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Team lead</label>
              <input
                type="text"
                readOnly
                value={user?.name ? `${user.name} (${user.email})` : (user?.email ?? '—')}
                className="w-full input-field rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant cursor-not-allowed"
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
          <label className="block text-sm font-medium text-on-surface mb-1">
            Realistic delivery date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={committedDate}
            onChange={(val) => setCommittedDate(val)}
            placeholder="Select delivery date"
            minDate={new Date()}
            className="input-field w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {idea.expectedDeliveryDate && (
            <p className="text-xs text-on-surface-variant/60 mt-1">
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
          <label className="block text-sm font-medium text-on-surface mb-1">
            Approach note <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            rows={4}
            placeholder="Describe how you plan to build this…"
            className="input-field w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
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
          disabled={submitting || !canBid}
          className="w-full bg-gradient-to-r from-primary to-primary-container hover:bg-primary text-white py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
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
