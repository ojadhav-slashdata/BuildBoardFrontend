import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

const pocSizes = [
  { name: 'Micro', time: '< 1 day', hours: '< 8 hrs', pts: 10, min: 4, max: 8 },
  { name: 'Small', time: '1–2 days', hours: '8–16 hrs', pts: 25, min: 8, max: 16 },
  { name: 'Medium', time: '3–5 days', hours: '16–40 hrs', pts: 50, min: 16, max: 40 },
  { name: 'Large', time: '1–2 weeks', hours: '40–80 hrs', pts: 100, min: 40, max: 80 },
];

const fpSizes = [
  { name: 'Medium', time: '1–2 weeks', hours: '40–80 hrs', pts: 50, min: 40, max: 80 },
  { name: 'Large', time: '3–4 weeks', hours: '80–160 hrs', pts: 100, min: 80, max: 160 },
  { name: 'XL', time: '1–2 months', hours: '160–320 hrs', pts: 200, min: 160, max: 320 },
  { name: 'Enterprise', time: '3–4 months', hours: '320–640 hrs', pts: 300, min: 320, max: 640 },
  { name: 'Epic', time: '5+ months', hours: '640+ hrs', pts: 400, min: 640, max: 800 },
];

const complexities = [
  { name: 'Low', bonus: 0 },
  { name: 'Medium', bonus: 20 },
  { name: 'High', bonus: 50 },
  { name: 'Innovative', bonus: 100 },
];

export default function Approvals() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [screen, setScreen] = useState('list'); // list, approve-form, approve-success, reject-form, reject-success

  // Approval form state
  const [projectType, setProjectType] = useState('POC');
  const [selectedSize, setSelectedSize] = useState(null);
  const [minHours, setMinHours] = useState(0);
  const [maxHours, setMaxHours] = useState(0);
  const [complexity, setComplexity] = useState('Low');
  const [complexityBonus, setComplexityBonus] = useState(0);
  const [bidCutoff, setBidCutoff] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [projectOwner, setProjectOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject state
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const res = await api.get('/ideas?status=PendingApproval');
      setIdeas(res.data || []);
    } catch { }
    setLoading(false);
  };

  const sizes = projectType === 'POC' ? pocSizes : fpSizes;
  const currentSize = sizes.find(s => s.name === selectedSize) || sizes[1] || sizes[0];
  const basePoints = currentSize?.pts || 0;
  const minPoints = Math.round((basePoints + complexityBonus) * 1.0);
  const maxPoints = Math.round((basePoints + complexityBonus) * 1.25 + 50);

  const openApproveForm = (idea) => {
    setSelectedIdea(idea);
    setProjectType(idea.projectType || 'POC');
    const defaultSizes = (idea.projectType === 'FullProduct') ? fpSizes : pocSizes;
    setSelectedSize(defaultSizes[1]?.name || defaultSizes[0]?.name);
    setMinHours(defaultSizes[1]?.min || defaultSizes[0]?.min);
    setMaxHours(defaultSizes[1]?.max || defaultSizes[0]?.max);
    setComplexity('Low');
    setComplexityBonus(0);
    setProjectOwner(idea.projectOwner || '');
    setBidCutoff('');
    setDeliveryDate('');
    setScreen('approve-form');
  };

  const openRejectForm = (idea) => {
    setSelectedIdea(idea);
    setRejectComment('');
    setScreen('reject-form');
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size.name);
    setMinHours(size.min);
    setMaxHours(size.max);
  };

  const handleComplexitySelect = (c) => {
    setComplexity(c.name);
    setComplexityBonus(c.bonus);
  };

  const handleApprove = async () => {
    if (!bidCutoff || !deliveryDate) { alert('Please set both dates.'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/ideas/${selectedIdea._id || selectedIdea.id}/approve`, {
        size: selectedSize,
        complexity,
        bidCutoffDate: new Date(bidCutoff).toISOString(),
        expectedDeliveryDate: new Date(deliveryDate).toISOString(),
        estimatedHours: maxHours,
        projectType,
      });
      setScreen('approve-success');
    } catch { alert('Failed to approve.'); }
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) { alert('Please add a rejection comment.'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/ideas/${selectedIdea._id || selectedIdea.id}/reject`, { comment: rejectComment });
      setScreen('reject-success');
    } catch { alert('Failed to reject.'); }
    setSubmitting(false);
  };

  const backToList = () => {
    setScreen('list');
    setSelectedIdea(null);
    fetchIdeas();
  };

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant/60">Loading...</div>;

  // ===== APPROVE SUCCESS SCREEN =====
  if (screen === 'approve-success') return (
    <div className="max-w-[620px] mx-auto">
      <div className="surface-card p-7">
        <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#1D9E75" strokeWidth="1.5"/><path d="M6 10l3 3 5-5" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 className="text-lg font-medium font-manrope text-on-surface mb-1">Idea approved</h2>
        <p className="text-sm text-on-surface-variant mb-5">The idea is now live and open for bidding. Employees have been notified.</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant/60 mb-3">Approval summary</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-on-surface-variant/60 text-xs mb-0.5">Idea</p><p className="font-medium text-on-surface">{selectedIdea?.title}</p></div>
          <div><p className="text-on-surface-variant/60 text-xs mb-0.5">Size</p><p className="font-medium"><span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">{selectedSize} · {basePoints} pts</span></p></div>
          <div><p className="text-on-surface-variant/60 text-xs mb-0.5">Bid cutoff</p><p className="font-medium text-on-surface">{bidCutoff}</p></div>
          <div><p className="text-on-surface-variant/60 text-xs mb-0.5">Expected delivery</p><p className="font-medium text-on-surface">{deliveryDate}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button onClick={backToList} className="py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-sm font-medium hover:bg-primary transition">Back to queue</button>
          <button onClick={() => navigate(`/ideas/${selectedIdea._id || selectedIdea.id}`)} className="py-2.5 bg-surface-container-low rounded-full text-sm hover:bg-surface-container-high transition">View idea</button>
        </div>
      </div>
    </div>
  );

  // ===== REJECT SUCCESS SCREEN =====
  if (screen === 'reject-success') return (
    <div className="max-w-[620px] mx-auto">
      <div className="surface-card p-7">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#A32D2D" strokeWidth="1.5"/><path d="M7 7l6 6M13 7l-6 6" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <h2 className="text-lg font-medium font-manrope text-on-surface mb-1">Idea rejected</h2>
        <p className="text-sm text-on-surface-variant mb-5">The submitter has been notified with your rejection comment.</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
          <p className="text-xs font-medium text-red-700 mb-1">Rejection reason</p>
          <p className="text-sm text-on-surface leading-relaxed">"{rejectComment}"</p>
        </div>
        <button onClick={backToList} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-sm font-medium hover:bg-primary transition">Back to queue</button>
      </div>
    </div>
  );

  // ===== REJECT FORM =====
  if (screen === 'reject-form') return (
    <div className="max-w-[620px] mx-auto">
      <div className="surface-card p-7">
        <button onClick={backToList} className="text-sm text-primary mb-4 hover:underline">← Back to queue</button>
        <h2 className="text-lg font-medium font-manrope text-on-surface mb-1">Reject idea</h2>
        <p className="text-sm text-on-surface-variant mb-5">Provide a reason so the submitter understands and can improve their next submission.</p>
        <div className="bg-surface-container-low rounded-lg p-3 mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">{selectedIdea?.title}</p>
            <p className="text-xs text-on-surface-variant">Category: {selectedIdea?.category} · {selectedIdea?.projectType}</p>
          </div>
        </div>
        <label className="text-sm font-medium text-on-surface block mb-1.5">Rejection comment <span className="text-red-500">*</span></label>
        <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={4} placeholder="Explain why this idea is not being approved at this time..."
          className="input-field w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y min-h-[96px]" />
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button onClick={handleReject} disabled={submitting} className="py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
            {submitting ? 'Rejecting...' : 'Confirm rejection'}
          </button>
          <button onClick={backToList} className="py-2.5 bg-surface-container-low rounded-lg text-sm hover:bg-surface-container-high transition">Cancel</button>
        </div>
      </div>
    </div>
  );

  // ===== APPROVAL FORM =====
  if (screen === 'approve-form') return (
    <div className="max-w-[660px] mx-auto">
      <div className="surface-card p-7">
        <button onClick={backToList} className="text-sm text-primary mb-4 hover:underline">← Back to queue</button>
        <h2 className="text-lg font-medium font-manrope text-on-surface mb-1">Approve idea</h2>
        <p className="text-sm text-on-surface-variant mb-5">Set the size, complexity, and dates before this idea goes live for bidding.</p>

        {/* Idea banner */}
        <div className="bg-surface-container-low rounded-lg p-3 mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">{selectedIdea?.title}</p>
            <p className="text-xs text-on-surface-variant">Category: {selectedIdea?.category} · Owner: {selectedIdea?.projectOwner || 'Not set'}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${projectType === 'FullProduct' ? 'bg-green-50 text-green-800' : 'bg-primary/10 text-primary'}`}>
            {projectType === 'FullProduct' ? 'Full product' : 'POC'}
          </span>
        </div>

        {/* Project Type */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant/60 mb-2 pb-1.5">Project type</p>
        <div className="grid grid-cols-2 gap-1.5 mb-5">
          {['POC', 'FullProduct'].map(t => (
            <button key={t} onClick={() => { setProjectType(t); const s = t === 'POC' ? pocSizes : fpSizes; setSelectedSize(s[1]?.name || s[0]?.name); setMinHours(s[1]?.min || s[0]?.min); setMaxHours(s[1]?.max || s[0]?.max); }}
              className={`py-2 text-sm rounded-lg text-center transition ${projectType === t ? 'border-[1.5px] border-primary bg-primary/10 text-primary font-medium' : 'border border-outline-variant/20 bg-surface-container-low text-on-surface-variant'}`}>
              {t === 'POC' ? 'POC — Quick prototype' : 'Full product — Production build'}
            </button>
          ))}
        </div>

        {/* Size */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant/60 mb-2 pb-1.5">Idea size</p>
        <div className={`grid gap-2 mb-4 ${projectType === 'POC' ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {sizes.map(s => (
            <button key={s.name} onClick={() => handleSizeSelect(s)}
              className={`p-2.5 rounded-lg text-center transition ${selectedSize === s.name ? 'border-[1.5px] border-primary bg-primary/10' : 'border border-outline-variant/20 bg-surface-container-low hover:border-primary/40'}`}>
              <span className={`text-sm font-medium block mb-0.5 ${selectedSize === s.name ? 'text-primary' : 'text-on-surface'}`}>{s.name}</span>
              <span className={`text-[11px] block mb-1 leading-tight ${selectedSize === s.name ? 'text-primary' : 'text-on-surface-variant/60'}`}>{s.time}<br/>{s.hours}</span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${selectedSize === s.name ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>{s.pts} pts</span>
            </button>
          ))}
        </div>

        {/* Hours */}
        <div className="bg-surface-container-low rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium text-on-surface">Expected hours</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-800">Recommended: {currentSize?.min}–{currentSize?.max} hrs</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Min hours</label>
              <input type="number" value={minHours} onChange={e => setMinHours(Number(e.target.value))} className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Max hours</label>
              <input type="number" value={maxHours} onChange={e => setMaxHours(Number(e.target.value))} className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 mt-2.5 flex items-center justify-between">
            <span className="text-xs text-primary">Expected effort range</span>
            <span className="text-sm font-medium text-primary">{minHours} – {maxHours} hrs</span>
          </div>
        </div>

        {/* Complexity */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant/60 mb-2 pb-1.5">Complexity</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {complexities.map(c => (
            <button key={c.name} onClick={() => handleComplexitySelect(c)}
              className={`p-2.5 rounded-lg text-center transition ${complexity === c.name ? 'border-[1.5px] border-green-600 bg-green-50' : 'border border-outline-variant/20 bg-surface-container-low hover:border-green-300'}`}>
              <span className={`text-xs font-medium block mb-0.5 ${complexity === c.name ? 'text-green-900' : 'text-on-surface'}`}>{c.name}</span>
              <span className={`text-[11px] ${complexity === c.name ? 'text-green-700' : 'text-on-surface-variant/60'}`}>+{c.bonus} pts</span>
            </button>
          ))}
        </div>

        {/* Points preview */}
        <div className="bg-surface-container-low rounded-lg p-4 mb-5">
          <p className="text-xs text-on-surface-variant mb-2">Points preview — what builder(s) can earn</p>
          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            <span className="text-on-surface">{basePoints} pts</span>
            <span className="text-on-surface-variant/60">+</span>
            <span className="text-on-surface">{complexityBonus} pts</span>
            <span className="text-on-surface-variant/60">×</span>
            <span className="text-on-surface">1.0–1.25</span>
            <span className="text-on-surface-variant/60">+</span>
            <span className="text-on-surface">0–50 pts</span>
            <span className="text-on-surface-variant/60">=</span>
            <span className="text-base font-medium text-primary">{minPoints}–{maxPoints} pts</span>
          </div>
          <p className="text-xs text-on-surface-variant/60 mt-1.5">Team bid: points split equally among confirmed members</p>
        </div>

        {/* Dates */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant/60 mb-2 pb-1.5">Dates & ownership</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm font-medium text-on-surface block mb-1.5">Bid cutoff date <span className="text-red-500">*</span></label>
            <input type="date" value={bidCutoff} onChange={e => setBidCutoff(e.target.value)} className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface block mb-1.5">Expected delivery <span className="text-red-500">*</span></label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="mb-5">
          <label className="text-sm font-medium text-on-surface block mb-1.5">Project owner</label>
          <input type="text" value={projectOwner} onChange={e => setProjectOwner(e.target.value)} className="input-field w-full px-2.5 py-2 rounded-lg text-sm outline-none focus:border-primary" />
        </div>

        <hr className="border-outline-variant/10 my-5" />
        <button onClick={handleApprove} disabled={submitting} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-sm font-medium hover:bg-primary transition disabled:opacity-50">
          {submitting ? 'Approving...' : 'Confirm approval — send to bidding'}
        </button>
      </div>
    </div>
  );

  // ===== IDEAS LIST =====
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-medium font-manrope tracking-tight text-on-surface mb-1">Approval queue</h1>
      <p className="text-sm text-on-surface-variant mb-6">Review submitted ideas and approve or reject them.</p>

      {ideas.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <p className="text-on-surface-variant/60">No ideas pending approval</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => (
            <div key={idea._id || idea.id} className="surface-card p-5 hover:border-primary/20 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium font-manrope text-on-surface">{idea.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{idea.category} · Owner: {idea.projectOwner || 'Not set'}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${idea.projectType === 'FullProduct' ? 'bg-green-50 text-green-800' : 'bg-primary/10 text-primary'}`}>
                  {idea.projectType === 'FullProduct' ? 'Full product' : 'POC'}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{idea.description}</p>
              <div className="flex gap-2">
                <button onClick={() => openApproveForm(idea)} className="px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-xs font-medium hover:bg-primary transition">Review & approve</button>
                <button onClick={() => openRejectForm(idea)} className="px-4 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface-variant hover:bg-surface-container-high transition">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
