import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PlaceBid() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('solo');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [committedDate, setCommittedDate] = useState('');
  const [approach, setApproach] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/ideas/${id}`)
      .then(({ data }) => setIdea(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const addMember = () => {
    const name = teamSearch.trim();
    if (name && !teamMembers.includes(name)) {
      setTeamMembers((m) => [...m, name]);
      setTeamSearch('');
    }
  };

  const removeMember = (name) => setTeamMembers((m) => m.filter((n) => n !== name));

  const getDateBanner = () => {
    if (!committedDate || !idea?.expectedDeliveryDate) return null;
    const committed = new Date(committedDate);
    const expected = new Date(idea.expectedDeliveryDate);
    if (committed < expected) return { text: 'Early delivery — +25% points bonus', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (committed.getTime() === expected.getTime()) return { text: 'On time delivery', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { text: 'Warning: exceeds expected delivery date', cls: 'bg-red-50 text-red-700 border-red-200' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/ideas/${id}/bids`, {
        mode,
        teamMembers: mode === 'team' ? teamMembers : [],
        committedDeliveryDate: committedDate,
        approach,
      });
      navigate('/my-bids');
    } catch {
      alert('Failed to submit bid.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!idea) return <p className="text-center text-gray-500 py-12">Idea not found.</p>;

  const banner = getDateBanner();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Idea Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h1 className="text-xl font-bold mb-3">{idea.title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${idea.projectType === 'POC' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>{idea.projectType}</span>
          {idea.size && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{idea.size}</span>}
          {idea.complexity && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">{idea.complexity}</span>}
          {idea.expectedDeliveryDate && <span className="text-xs text-gray-500">Due: {new Date(idea.expectedDeliveryDate).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Bid Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          {['solo', 'team'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m === 'solo' ? 'Solo Bid' : 'Team Bid'}
            </button>
          ))}
        </div>

        {/* Team Members */}
        {mode === 'team' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Members</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} placeholder="Search member..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="button" onClick={addMember} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((m) => (
                <span key={m} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  {m}
                  <button type="button" onClick={() => removeMember(m)} className="hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Committed Delivery Date</label>
          <input type="date" required value={committedDate} onChange={(e) => setCommittedDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Smart Banner */}
        {banner && (
          <div className={`border rounded-lg px-4 py-3 text-sm font-medium ${banner.cls}`}>
            {banner.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Approach / Notes</label>
          <textarea value={approach} onChange={(e) => setApproach(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Bid'}
        </button>
      </form>
    </div>
  );
}
