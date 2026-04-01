import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const ratings = ['Poor', 'Average', 'Good', 'Excellent'];

export default function Feedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 'Good', comment: '' });

  useEffect(() => {
    api.get(`/ideas/${id}`)
      .then(({ data }) => setIdea(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/ideas/${id}/feedback`, form);
      navigate(`/ideas/${id}`);
    } catch {
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!idea) return <p className="text-center text-gray-500 py-12">Idea not found.</p>;
  if (idea.status !== 'Completed') {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">⏳</p>
        <p className="text-xl font-semibold text-gray-700">Not Ready for Feedback</p>
        <p className="text-gray-500 mt-2">This idea must be completed before feedback can be given.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Give Feedback</h1>

      {/* Idea Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="font-semibold text-gray-800">{idea.title}</span>
          <StatusBadge status={idea.status} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${idea.projectType === 'POC' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
            {idea.projectType}
          </span>
          {idea.size && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{idea.size}</span>}
        </div>
        {idea.complexity && <p className="text-sm text-gray-500">Complexity: {idea.complexity}</p>}
      </div>

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div className="flex gap-3">
            {ratings.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rating: r }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  form.rating === r
                    ? r === 'Excellent' ? 'bg-green-600 text-white border-green-600'
                    : r === 'Good' ? 'bg-blue-600 text-white border-blue-600'
                    : r === 'Average' ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
          <textarea
            rows={4}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Share your feedback on the demo and delivery..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
