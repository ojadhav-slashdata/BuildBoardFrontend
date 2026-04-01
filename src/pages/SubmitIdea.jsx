import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

const categories = ['Tech', 'HR', 'Finance', 'Operations', 'Other'];

export default function SubmitIdea() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', projectType: 'POC', projectOwner: '' });
  const [submitting, setSubmitting] = useState(false);
  const [titleCount, setTitleCount] = useState(0);
  const [descCount, setDescCount] = useState(0);

  // User search for project owner
  const [users, setUsers] = useState([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(ownerSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(ownerSearch.toLowerCase())
  );

  const update = (field) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (field === 'title') setTitleCount(val.length);
    if (field === 'description') setDescCount(val.length);
  };

  const selectOwner = (user) => {
    setForm(f => ({ ...f, projectOwner: user.name || user.email }));
    setOwnerSearch(user.name || user.email);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (descCount < 50) { alert('Description must be at least 50 characters.'); return; }
    if (!form.category) { alert('Please select a category.'); return; }
    if (!form.projectOwner) { alert('Please select a project owner.'); return; }
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-7 sm:p-8 max-w-[680px] mx-auto">
        {/* Header */}
        <div className="mb-7">
          <p className="text-xl font-medium text-gray-900 m-0 mb-1">
            Submit new idea
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 ml-2 align-middle">
              Idea submission
            </span>
          </p>
          <p className="text-sm text-gray-500 m-0">
            Share your idea with the team. A manager will review and approve it before it goes live for bidding.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-medium text-gray-900">
                Title <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${titleCount > 108 ? 'text-amber-600' : 'text-gray-400'}`}>
                {titleCount} / 120
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={form.title}
              onChange={update('title')}
              placeholder="Give your idea a clear, descriptive name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-medium text-gray-900">
                Description <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${descCount < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                {descCount < 50 ? `${descCount} / min 50` : `${descCount} chars ✓`}
              </span>
            </div>
            <textarea
              required
              value={form.description}
              onChange={update('description')}
              placeholder="Describe the problem you're solving and why it matters to the team..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition resize-y min-h-[96px] leading-relaxed"
              rows={4}
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimum 50 characters. Include the problem, proposed solution, and expected impact.
            </p>
          </div>

          {/* Category + Project Owner row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <div className="mb-1.5">
                <label className="text-sm font-medium text-gray-900">
                  Category <span className="text-red-500">*</span>
                </label>
              </div>
              <select
                required
                value={form.category}
                onChange={update('category')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition appearance-none bg-no-repeat bg-[right_12px_center] cursor-pointer"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", paddingRight: '32px' }}
              >
                <option value="">Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div ref={dropdownRef} className="relative">
              <div className="mb-1.5">
                <label className="text-sm font-medium text-gray-900">
                  Project owner <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={ownerSearch}
                  onChange={(e) => { setOwnerSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by name or email..."
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                />
                {showDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.slice(0, 8).map(u => (
                      <button
                        key={u.id || u.email}
                        type="button"
                        onClick={() => selectOwner(u)}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center gap-2 text-sm"
                      >
                        {u.pictureUrl ? (
                          <img src={u.pictureUrl} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-600 font-medium">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-gray-900 font-medium">{u.name}</div>
                          <div className="text-gray-400 text-xs">{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                The person who raised this idea and can answer requirement questions.
              </p>
            </div>
          </div>

          {/* Project Type */}
          <div className="mb-5">
            <div className="mb-1.5">
              <label className="text-sm font-medium text-gray-900">
                Project type <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, projectType: 'POC' }))}
                className={`p-3 border rounded-lg text-left transition ${
                  form.projectType === 'POC'
                    ? 'border-indigo-500 border-[1.5px] bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className={`text-sm font-medium block mb-0.5 ${form.projectType === 'POC' ? 'text-indigo-800' : 'text-gray-900'}`}>
                  POC
                </span>
                <span className={`text-xs block leading-snug ${form.projectType === 'POC' ? 'text-indigo-600' : 'text-gray-500'}`}>
                  Quick prototype to validate the idea. Smaller scope, faster delivery.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, projectType: 'FullProduct' }))}
                className={`p-3 border rounded-lg text-left transition ${
                  form.projectType === 'FullProduct'
                    ? 'border-indigo-500 border-[1.5px] bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className={`text-sm font-medium block mb-0.5 ${form.projectType === 'FullProduct' ? 'text-indigo-800' : 'text-gray-900'}`}>
                  Full product
                </span>
                <span className={`text-xs block leading-snug ${form.projectType === 'FullProduct' ? 'text-indigo-600' : 'text-gray-500'}`}>
                  End-to-end production build. Larger scope, longer timeline.
                </span>
              </button>
            </div>
          </div>

          <hr className="border-gray-100 my-6" />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit idea for review'}
          </button>
        </form>
      </div>
    </div>
  );
}
