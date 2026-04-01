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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <button onClick={() => navigate('/portal')} className="flex items-center gap-1 text-primary font-semibold text-sm mb-4 hover:opacity-80 transition">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Projects
        </button>
        <h1 className="section-heading text-4xl lg:text-5xl mb-4">Submit new idea</h1>
        <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
          Fill in the details below to bring your vision to life. Your submission will be routed to the appropriate innovation review board.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Section 1: General Information */}
        <section className="surface-card-elevated p-8 lg:p-10">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-sm font-bold">1</span>
            General Information
          </h3>

          <div className="space-y-8">
            {/* Title */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-on-surface-variant">Title <span className="text-error">*</span></label>
                <span className={`text-xs ${titleCount > 108 ? 'text-amber-600' : 'text-on-surface-variant/50'}`}>{titleCount} / 120</span>
              </div>
              <input type="text" required maxLength={120} value={form.title} onChange={update('title')} placeholder="Enter a descriptive title for your idea" className="input-field w-full" />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-on-surface-variant">Description <span className="text-error">*</span></label>
                <span className={`text-xs ${descCount < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {descCount < 50 ? `${descCount} / min 50` : `${descCount} chars`}
                </span>
              </div>
              <textarea required value={form.description} onChange={update('description')} placeholder="Explain the problem you're solving and your proposed solution..." className="input-field w-full resize-y min-h-[120px] leading-relaxed" rows={5} />
              <p className="text-xs text-on-surface-variant/50 mt-2">Minimum 50 characters. Include the problem, proposed solution, and expected impact.</p>
            </div>

            {/* Category + Owner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Category <span className="text-error">*</span></label>
                <select required value={form.category} onChange={update('category')} className="input-field w-full appearance-none cursor-pointer">
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Project owner <span className="text-error">*</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">search</span>
                  <input type="text" value={ownerSearch} onChange={(e) => { setOwnerSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} placeholder="Search by name or email..." className="input-field w-full pl-10" />
                  {showDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 surface-card-elevated max-h-48 overflow-y-auto">
                      {filteredUsers.slice(0, 8).map(u => (
                        <button key={u.id || u.email} type="button" onClick={() => selectOwner(u)} className="w-full text-left px-4 py-3 hover:bg-surface-container-low flex items-center gap-3 text-sm transition-colors">
                          {u.pictureUrl ? (
                            <img src={u.pictureUrl} alt="" className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                              {(u.name || u.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-on-surface font-medium">{u.name}</div>
                            <div className="text-on-surface-variant/60 text-xs">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Project Scope */}
        <section>
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-sm font-bold">2</span>
            Project Scope
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button type="button" onClick={() => setForm(f => ({ ...f, projectType: 'POC' }))} className={`group relative bg-surface-container-low p-8 rounded-4xl cursor-pointer transition-all duration-300 text-left ${form.projectType === 'POC' ? 'ring-2 ring-primary/30 bg-surface-container-lowest' : 'hover:bg-surface-container-lowest'}`}>
              <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">biotech</span>
              </div>
              <h4 className="text-xl font-bold mb-2 text-on-surface">POC</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Proof of Concept focus. Quick prototype to validate the idea with minimal overhead.</p>
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, projectType: 'FullProduct' }))} className={`group relative bg-surface-container-low p-8 rounded-4xl cursor-pointer transition-all duration-300 text-left ${form.projectType === 'FullProduct' ? 'ring-2 ring-primary/30 bg-surface-container-lowest' : 'hover:bg-surface-container-lowest'}`}>
              <div className="w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
              </div>
              <h4 className="text-xl font-bold mb-2 text-on-surface">Full product</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Comprehensive development track. Full lifecycle from design to deployment.</p>
            </button>
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
          <div className="text-sm text-on-surface-variant/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">info</span>
            Progress is automatically saved as a draft
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full md:w-auto px-10 py-4 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit idea for review'}
          </button>
        </div>
      </form>
    </div>
  );
}
