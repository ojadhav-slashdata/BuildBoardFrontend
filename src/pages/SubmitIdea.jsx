import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

const categories = ['AI/ML', 'Automation', 'DevTools', 'UX', 'Infrastructure', 'Other'];
const projectTypes = ['POC', 'FullProduct'];

export default function SubmitIdea() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: categories[0], projectType: projectTypes[0], projectOwner: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/ideas', form);
      navigate('/portal');
    } catch {
      alert('Failed to submit idea.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit New Idea</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={form.title} onChange={update('title')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea required value={form.description} onChange={update('description')} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={update('category')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <select value={form.projectType} onChange={update('projectType')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {projectTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Owner</label>
          <input type="text" required value={form.projectOwner} onChange={update('projectOwner')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Idea'}
        </button>
      </form>
    </div>
  );
}
