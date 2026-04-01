import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const ratings = ['Poor', 'Average', 'Good', 'Excellent'];
const ratingColors = {
  Excellent: 'bg-emerald-600 text-white',
  Good: 'bg-blue-600 text-white',
  Average: 'bg-amber-500 text-white',
  Poor: 'bg-red-500 text-white',
};

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
  if (!idea) return <p className="text-center text-on-surface-variant py-12">Idea not found.</p>;
  if (idea.status !== 'Completed') {
    return (
      <div className="text-center py-24">
        <div className="h-20 w-20 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">⏳</span>
        </div>
        <p className="text-xl font-manrope font-bold text-on-surface">Not Ready for Feedback</p>
        <p className="text-on-surface-variant mt-2">This idea must be completed before feedback can be given.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="section-heading text-2xl mb-6">Give Feedback</h1>

      {/* Idea Summary */}
      <div className="surface-card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="font-semibold text-on-surface">{idea.title}</span>
          <StatusBadge status={idea.status} />
          <span className="status-chip">{idea.projectType}</span>
          {idea.size && <span className="status-chip">{idea.size}</span>}
        </div>
        {idea.complexity && <p className="text-sm text-on-surface-variant">Complexity: {idea.complexity}</p>}
      </div>

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="surface-card-elevated p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-3">Rating</label>
          <div className="flex gap-3">
            {ratings.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rating: r }))}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  form.rating === r ? ratingColors[r] : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">Comment</label>
          <textarea
            rows={4}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Share your feedback on the demo and delivery..."
            className="input-field w-full"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
