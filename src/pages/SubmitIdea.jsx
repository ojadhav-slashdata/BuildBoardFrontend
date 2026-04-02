import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

const categories = ['Tech', 'HR', 'Finance', 'Operations', 'Other'];

const BUSINESS_VALUES = [
  'Cost saving',
  'Efficiency',
  'Customer acquisition',
  'Customer satisfaction',
  'Product enhancement',
  'Other',
];

const EFFORT_OPTIONS = ['< 1 week', '1–2 weeks', '1 month', '3+ months'];
const IMPACT_OPTIONS = ['Low', 'Medium', 'High', 'Transformative'];
const RESOURCE_OPTIONS = ['Solo', 'Small team', 'Cross-dept', 'Enterprise'];

export default function SubmitIdea() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    projectType: 'POC',
    projectOwner: '',
    businessValue: [],
    resources: '',
    challenges: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [titleCount, setTitleCount] = useState(0);
  const [descCount, setDescCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [categoryLeads, setCategoryLeads] = useState({});

  useEffect(() => {
    api.get('/department-leads').then(res => {
      const map = {};
      for (const lead of (res.data || [])) {
        map[lead.category] = { name: lead.leadName, email: lead.leadEmail };
      }
      setCategoryLeads(map);
    }).catch(() => {});
  }, []);

  const update = (field) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (field === 'title') setTitleCount(val.length);
    if (field === 'description') setDescCount(val.length);
  };

  const toggleBusinessValue = (tag) => {
    setForm(f => ({
      ...f,
      businessValue: f.businessValue.includes(tag)
        ? f.businessValue.filter(t => t !== tag)
        : [...f.businessValue, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('Please enter a title.'); return; }
    if (descCount < 50) { alert('Description must be at least 50 characters.'); return; }
    if (!form.category) { alert('Please select a category.'); return; }
    if (!form.projectOwner) { alert('Please select an assigned approver.'); return; }
    if (form.businessValue.length === 0) { alert('Please select at least one business value.'); return; }
    if (file && file.size > 3 * 1024 * 1024) {
      alert('File is too large. Maximum size is 3MB.');
      return;
    }
    setSubmitting(true);
    try {
      let attachment = null;
      let attachmentName = null;
      if (file) {
        attachmentName = file.name;
        attachment = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }
      await api.post('/ideas', {
        ...form,
        businessValue: form.businessValue.join(','),
        resources: form.resources,
        challenges: form.challenges,
        attachment,
        attachmentName,
      });
      navigate('/portal');
    } catch {
      alert('Failed to submit idea.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* ── Page Header ── */}
      <div className="mb-12">
        <button
          onClick={() => navigate('/portal')}
          className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm mb-6 hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Projects
        </button>

        <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-4 leading-none">
          Submit new idea
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
          Bring your vision to life. Your submission will be routed to the appropriate innovation review board.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ══════════════════════════════════════
            SECTION 1 — General Information
        ══════════════════════════════════════ */}
        <section className="bg-surface-container-low rounded-lg p-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              1
            </span>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">General Information</h2>
          </div>

          <div className="space-y-7">
            {/* Title */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Title <span className="text-error">*</span>
                </label>
                <span className={`text-xs tabular-nums ${titleCount > 108 ? 'text-amber-600' : 'text-on-surface-variant/50'}`}>
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
                className="w-full rounded-2xl py-4 px-5 bg-surface-container-lowest border-none text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Description <span className="text-error">*</span>
                </label>
                <span className={`text-xs tabular-nums ${descCount < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {descCount < 50 ? `${descCount} / min 50` : `${descCount} chars ✓`}
                </span>
              </div>

              {/* Rich-text-style toolbar (visual only) */}
              <div className="flex items-center gap-1 mb-2 px-3 py-2 bg-surface-container-lowest rounded-2xl rounded-b-none border-b border-surface-container-high">
                {['format_bold', 'format_italic', 'format_list_bulleted', 'format_list_numbered', 'link'].map(icon => (
                  <button
                    key={icon}
                    type="button"
                    tabIndex={-1}
                    className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant/60 hover:text-on-surface"
                    aria-label={icon}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
                  </button>
                ))}
              </div>
              <textarea
                required
                value={form.description}
                onChange={update('description')}
                placeholder="Describe the problem you're solving and why it matters to the team…"
                rows={5}
                className="w-full rounded-2xl rounded-t-none py-4 px-5 bg-surface-container-lowest border-none text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y min-h-[120px] leading-relaxed placeholder:text-slate-400"
              />
              <p className="text-xs text-on-surface-variant/50 mt-2">
                Minimum 50 characters. Include the problem, proposed solution, and expected impact.
              </p>
            </div>

            {/* Category + Approver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                  Category <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setForm(f => ({ ...f, category: cat }));
                      const approver = categoryLeads[cat];
                      if (approver) {
                        setForm(f => ({ ...f, category: cat, projectOwner: approver.name }));
                        setOwnerSearch(approver.name);
                      }
                    }}
                    className="w-full rounded-2xl py-4 px-5 bg-surface-container-lowest border-none text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" style={{ fontSize: '20px' }}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Assigned Approver (read-only, auto-filled from category) */}
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                  Assigned Approver
                </label>
                <div className={`w-full rounded-2xl py-4 px-5 text-sm transition-all ${
                  form.projectOwner
                    ? 'bg-primary/5 border border-primary/20 text-on-surface'
                    : 'bg-surface-container-lowest text-on-surface-variant/40'
                }`}>
                  {form.projectOwner ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>verified_user</span>
                      {form.projectOwner}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_off</span>
                      Select a category to assign approver
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant/50 mt-2">
                  Auto-assigned based on category's department lead.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 2 — Project Scope
        ══════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              2
            </span>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Project Scope</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* POC */}
            <label className={`relative block cursor-pointer border-2 rounded-2xl p-7 transition-all duration-200 ${
              form.projectType === 'POC'
                ? 'border-primary bg-surface-container-low'
                : 'border-transparent bg-surface-container-low hover:border-primary/20'
            }`}>
              <input
                type="radio"
                name="projectType"
                value="POC"
                checked={form.projectType === 'POC'}
                onChange={() => setForm(f => ({ ...f, projectType: 'POC' }))}
                className="sr-only"
              />
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  form.projectType === 'POC' ? 'bg-primary/10' : 'bg-surface-container-high'
                }`}>
                  <span className={`material-symbols-outlined text-2xl ${form.projectType === 'POC' ? 'text-primary' : 'text-on-surface-variant'}`}>
                    biotech
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">POC</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Quick prototype to validate the idea. Smaller scope, faster delivery.
                  </p>
                </div>
              </div>
              {form.projectType === 'POC' && (
                <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                </span>
              )}
            </label>

            {/* Full Product */}
            <label className={`relative block cursor-pointer border-2 rounded-2xl p-7 transition-all duration-200 ${
              form.projectType === 'FullProduct'
                ? 'border-primary bg-surface-container-low'
                : 'border-transparent bg-surface-container-low hover:border-primary/20'
            }`}>
              <input
                type="radio"
                name="projectType"
                value="FullProduct"
                checked={form.projectType === 'FullProduct'}
                onChange={() => setForm(f => ({ ...f, projectType: 'FullProduct' }))}
                className="sr-only"
              />
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  form.projectType === 'FullProduct' ? 'bg-primary/10' : 'bg-surface-container-high'
                }`}>
                  <span className={`material-symbols-outlined text-2xl ${form.projectType === 'FullProduct' ? 'text-primary' : 'text-on-surface-variant'}`}>
                    rocket_launch
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">Full Product</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    End-to-end production build. Larger scope, longer timeline.
                  </p>
                </div>
              </div>
              {form.projectType === 'FullProduct' && (
                <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                </span>
              )}
            </label>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 3 — Business Context
        ══════════════════════════════════════ */}
        <section className="bg-surface-container-low rounded-lg p-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              3
            </span>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Business Context</h2>
          </div>

          <div className="space-y-8">
            {/* Business Value Tags */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                Business value <span className="text-error">*</span>
              </label>
              <p className="text-xs text-on-surface-variant/60 mb-4">What will this idea improve? Select all that apply.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_VALUES.map(tag => {
                  const active = form.businessValue.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleBusinessValue(tag)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 text-left ${
                        active
                          ? 'bg-primary text-white shadow-tonal'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-emerald-300' : 'bg-outline-variant'}`} />
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metric Cards — Effort / Impact / Resource */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-4">
                Quick estimate
                <span className="font-normal text-on-surface-variant/50 ml-2">(optional)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {/* Est. Effort */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>schedule</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Est. Effort</span>
                  </div>
                  <select className="w-full bg-transparent border-none outline-none text-sm font-medium text-on-surface cursor-pointer appearance-none">
                    <option value="">— select —</option>
                    {EFFORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* Potential Impact */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>trending_up</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Potential Impact</span>
                  </div>
                  <select className="w-full bg-transparent border-none outline-none text-sm font-medium text-on-surface cursor-pointer appearance-none">
                    <option value="">— select —</option>
                    {IMPACT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* Resource Req. */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>group</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Resource Req.</span>
                  </div>
                  <select className="w-full bg-transparent border-none outline-none text-sm font-medium text-on-surface cursor-pointer appearance-none">
                    <option value="">— select —</option>
                    {RESOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Resources & Stakeholders */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Resources &amp; stakeholders needed
                <span className="font-normal text-on-surface-variant/50 ml-2">(optional)</span>
              </label>
              <textarea
                value={form.resources}
                onChange={update('resources')}
                placeholder="Who might need to be involved? Any teams, tools, or budget required?"
                rows={3}
                className="w-full rounded-2xl py-4 px-5 bg-surface-container-lowest border-none text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y min-h-[80px] leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* Known Challenges */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Known challenges
                <span className="font-normal text-on-surface-variant/50 ml-2">(optional)</span>
              </label>
              <textarea
                value={form.challenges}
                onChange={update('challenges')}
                placeholder="Any anticipated obstacles or risks the builder should be aware of?"
                rows={3}
                className="w-full rounded-2xl py-4 px-5 bg-surface-container-lowest border-none text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y min-h-[80px] leading-relaxed placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 4 — Supporting Materials
        ══════════════════════════════════════ */}
        <section className="bg-surface-container-low rounded-lg p-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              4
            </span>
            <div>
              <h2 className="text-xl font-bold text-on-surface tracking-tight leading-none">Supporting Materials</h2>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">optional</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => !file && document.getElementById('file-upload').click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            className={`rounded-3xl p-12 text-center transition-all duration-200 border-2 border-dashed cursor-pointer ${
              isDragging
                ? 'border-primary/50 bg-primary/5'
                : file
                  ? 'border-emerald-400/40 bg-surface-container-lowest cursor-default'
                  : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/30 hover:bg-primary/[0.02]'
            }`}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />

            {file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">description</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{file.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-error/70 hover:text-error transition-colors mt-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl">cloud_upload</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Drag &amp; drop or <span className="text-primary underline underline-offset-2 cursor-pointer">browse</span>
                  </p>
                  <p className="text-xs text-on-surface-variant/50 mt-1">
                    PNG, JPG, PDF — up to 3 MB &nbsp;·&nbsp; Helps explain your idea visually
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════
            FOOTER — Save draft + Submit
        ══════════════════════════════════════ */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-4">
          <p className="text-xs italic text-on-surface-variant/40 text-center md:text-left leading-relaxed max-w-xs">
            By submitting you agree that this idea is original and does not contain confidential third-party information.
          </p>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="flex-1 md:flex-none px-7 py-4 rounded-2xl bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 md:flex-none btn-primary px-10 py-4 text-base rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting…
                </span>
              ) : (
                'Submit for review'
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
