import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const sizeOptions = [
  { value: 'Micro', label: 'Micro (< 4 hrs)' },
  { value: 'Small', label: 'Small (1–2 days)' },
  { value: 'Medium', label: 'Medium (3–5 days)' },
  { value: 'Large', label: 'Large (1–2 weeks)' },
  { value: 'XL', label: 'XL (1–2 months)' },
  { value: 'Enterprise', label: 'Enterprise (3+ months)' },
];
const complexities = ['Low', 'Medium', 'High', 'Innovative'];

export default function Approvals() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get('/ideas?status=PendingApproval')
      .then(({ data }) => setIdeas(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      setForm({ size: 'Medium', complexity: 'Medium', bidCutoffDate: '', expectedDeliveryDate: '' });
    }
  };

  const approve = async (id) => {
    try {
      await api.patch(`/ideas/${id}/approve`, form);
      setIdeas((list) => list.filter((i) => i._id !== id));
      setExpanded(null);
    } catch {
      alert('Failed to approve.');
    }
  };

  const reject = async (id) => {
    const comment = prompt('Rejection reason (optional):');
    try {
      await api.patch(`/ideas/${id}/reject`, { comment });
      setIdeas((list) => list.filter((i) => i._id !== id));
      setExpanded(null);
    } catch {
      alert('Failed to reject.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (ideas.length === 0) return <EmptyState message="No ideas pending approval." icon="✅" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Approvals</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {ideas.map((idea) => (
          <div key={idea._id}>
            <button onClick={() => toggleExpand(idea._id)} className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-800">{idea.title}</span>
                <StatusBadge status={idea.status} />
              </div>
              <span className="text-gray-400">{expanded === idea._id ? '▲' : '▼'}</span>
            </button>
            {expanded === idea._id && (
              <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <select value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {sizeOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
                    <select value={form.complexity} onChange={(e) => setForm((f) => ({ ...f, complexity: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {complexities.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bid Cutoff Date</label>
                    <input type="datetime-local" value={form.bidCutoffDate || ''} onChange={(e) => setForm((f) => ({ ...f, bidCutoffDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                    <input type="datetime-local" value={form.expectedDeliveryDate || ''} onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => approve(idea._id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">Approve &amp; Publish</button>
                  <button onClick={() => reject(idea._id)} className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition">Reject</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
