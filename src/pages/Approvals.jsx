import { useState, useEffect, useRef } from 'react';
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
  const [bidCutoffTime, setBidCutoffTime] = useState('18:00');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [projectOwner, setProjectOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject state
  const [rejectComment, setRejectComment] = useState('');

  // List view state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // User search for project owner assignment
  const [users, setUsers] = useState([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const ownerDropdownRef = useRef(null);

  useEffect(() => {
    fetchIdeas();
    api.get('/users').then(res => setUsers(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target)) {
        setShowOwnerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check for direct idea review link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const directIdeaId = params.get('ideaId');
    if (directIdeaId && ideas.length > 0) {
      const idea = ideas.find(i => (i._id || i.id) === directIdeaId);
      if (idea) openApproveForm(idea);
    }
  }, [ideas]);

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
    setProjectOwner('');
    setOwnerSearch('');
    setShowOwnerDropdown(false);
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
    if (!projectOwner.trim()) { alert('Please assign a project owner.'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/ideas/${selectedIdea._id || selectedIdea.id}/approve`, {
        size: selectedSize,
        complexity,
        bidCutoffDate: bidCutoff ? new Date(`${bidCutoff}T${bidCutoffTime || '18:00'}`).toISOString() : null,
        expectedDeliveryDate: new Date(deliveryDate).toISOString(),
        estimatedHours: maxHours,
        projectType,
        projectOwner,
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
        {selectedIdea?.description && (
          <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{selectedIdea.description}</p>
        )}
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

        {/* Idea summary */}
        <div className="bg-surface-container-low rounded-lg p-4 mb-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-on-surface">{selectedIdea?.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${projectType === 'FullProduct' ? 'bg-green-50 text-green-800' : 'bg-primary/10 text-primary'}`}>
              {projectType === 'FullProduct' ? 'Full product' : 'POC'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{selectedIdea?.description}</p>

          {selectedIdea?.businessValue && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedIdea.businessValue.split(',').map((tag, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag.trim()}</span>
              ))}
            </div>
          )}

          {selectedIdea?.resources && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-on-surface-variant mb-1">Resources & Stakeholders</p>
              <p className="text-sm text-on-surface-variant">{selectedIdea.resources}</p>
            </div>
          )}

          {selectedIdea?.challenges && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-amber-700 mb-1">Known Challenges</p>
              <p className="text-sm text-amber-800 bg-amber-50 rounded-md p-3">{selectedIdea.challenges}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-outline-variant/10">
            <div>
              <p className="text-xs text-on-surface-variant/60">Category</p>
              <p className="text-sm font-medium text-on-surface">{selectedIdea?.category || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60">Submitted by</p>
              <p className="text-sm font-medium text-on-surface">{selectedIdea?.submittedByName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/60">Submitted</p>
              <p className="text-sm font-medium text-on-surface">{selectedIdea?.createdAt ? new Date(selectedIdea.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          {selectedIdea?.attachmentUrl && (
            <div className="mt-3 pt-3 border-t border-outline-variant/10">
              <p className="text-xs font-semibold text-on-surface-variant mb-2">Attached File</p>
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl">
                {selectedIdea.attachmentUrl.startsWith('data:image') ? (
                  <img src={selectedIdea.attachmentUrl} alt="Attachment" className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">description</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{selectedIdea.attachmentName || 'Attachment'}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">Uploaded with idea submission</p>
                </div>
                <a href={selectedIdea.attachmentUrl} target="_blank" rel="noopener noreferrer" download={selectedIdea.attachmentName}
                  className="btn-primary text-xs px-3 py-1.5">
                  <span className="material-symbols-outlined text-sm mr-1">download</span>
                  Download
                </a>
              </div>
            </div>
          )}
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
            <label className="text-sm font-medium text-on-surface block mb-1.5">Bid cutoff <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="date" value={bidCutoff.split('T')[0] || bidCutoff} onChange={e => {
                  const time = bidCutoffTime || '18:00';
                  setBidCutoff(e.target.value);
                  setBidCutoffTime(time);
                }}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field w-full px-3 py-3 rounded-xl text-sm cursor-pointer" />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-lg">calendar_month</span>
              </div>
              <select value={bidCutoffTime} onChange={e => setBidCutoffTime(e.target.value)}
                className="input-field px-3 py-3 rounded-xl text-sm cursor-pointer w-28">
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="21:00">9:00 PM</option>
                <option value="22:00">10:00 PM</option>
                <option value="23:00">11:00 PM</option>
                <option value="23:59">Midnight</option>
              </select>
            </div>
            <p className="text-xs text-on-surface-variant/40 mt-1">Date and time when bidding window closes</p>
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface block mb-1.5">Expected delivery <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                min={bidCutoff || new Date().toISOString().split('T')[0]}
                className="input-field w-full px-3 py-3 rounded-xl text-sm outline-none focus:border-primary cursor-pointer appearance-none" />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-lg">calendar_month</span>
            </div>
            <p className="text-xs text-on-surface-variant/40 mt-1">Target completion for builders</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-sm font-medium text-on-surface block mb-1.5">
            Assign Project Owner <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-on-surface-variant/60 mb-3">
            The project owner provides requirements and answers builder questions. They can be the idea creator or someone from the relevant department.
          </p>

          {/* Quick assign options */}
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => {
              const email = selectedIdea?.submittedByEmail || selectedIdea?.submittedByName || selectedIdea?.projectOwner || '';
              if (email) {
                setProjectOwner(email);
                setOwnerSearch('');
                setShowOwnerDropdown(false);
              }
            }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                projectOwner && (projectOwner === selectedIdea?.submittedByEmail || projectOwner === selectedIdea?.submittedByName)
                  ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              <span className="material-symbols-outlined text-sm mr-1 align-middle">person</span>
              Idea Creator{selectedIdea?.submittedByName ? ` (${selectedIdea.submittedByName})` : ''}
            </button>
            <button type="button" onClick={() => {
              setProjectOwner('');
              setOwnerSearch('');
            }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                projectOwner && projectOwner !== selectedIdea?.submittedByEmail
                  ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              <span className="material-symbols-outlined text-sm mr-1 align-middle">person_search</span>
              Someone Else
            </button>
          </div>

          {/* User search dropdown — only show when NOT using Idea Creator */}
          {!(projectOwner && (projectOwner === selectedIdea?.submittedByEmail || projectOwner === selectedIdea?.submittedByName)) && (
            <div ref={ownerDropdownRef} className="relative">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
                <input type="text"
                  value={ownerSearch || projectOwner}
                  onChange={e => { setOwnerSearch(e.target.value); setProjectOwner(''); setShowOwnerDropdown(true); }}
                  onFocus={() => setShowOwnerDropdown(true)}
                  placeholder="Search by name or email…"
                  className="input-field w-full pl-10" />
              </div>
              {showOwnerDropdown && (ownerSearch || '').length > 0 && (() => {
                const filtered = users.filter(u =>
                  (u.name || '').toLowerCase().includes((ownerSearch || '').toLowerCase()) ||
                  (u.email || '').toLowerCase().includes((ownerSearch || '').toLowerCase())
                );
                return filtered.length > 0 ? (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-tonal-lg max-h-52 overflow-y-auto border border-outline-variant/20">
                    {filtered.slice(0, 8).map(u => (
                      <button key={u.id || u.email} type="button"
                        onClick={() => { setProjectOwner(u.email); setOwnerSearch(''); setShowOwnerDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low flex items-center gap-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl">
                        {u.pictureUrl ? (
                          <img src={u.pictureUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold flex-shrink-0">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-on-surface font-medium truncate text-sm">{u.name}</div>
                          <div className="text-on-surface-variant/60 text-xs truncate">{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          )}
          {projectOwner && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span className="text-sm font-medium text-on-surface">{projectOwner}</span>
            </div>
          )}
          <p className="text-xs text-on-surface-variant/40 mt-1.5">This person will be the main contact for builders working on this idea.</p>
        </div>

        <hr className="border-outline-variant/10 my-5" />
        <button onClick={handleApprove} disabled={submitting} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-sm font-medium hover:bg-primary transition disabled:opacity-50">
          {submitting ? 'Approving...' : 'Confirm approval — send to bidding'}
        </button>
      </div>
    </div>
  );

  // ===== IDEAS LIST =====
  const CATEGORY_ICONS = { Tech: 'computer', HR: 'groups', Finance: 'payments', Operations: 'settings', Other: 'lightbulb' };
  const CATEGORY_COLORS = { Tech: 'bg-sky-50 text-sky-600', HR: 'bg-violet-50 text-violet-600', Finance: 'bg-emerald-50 text-emerald-600', Operations: 'bg-amber-50 text-amber-600', Other: 'bg-slate-50 text-slate-600' };

  const filteredIdeas = ideas
    .filter(idea => {
      if (search && !idea.title?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'Pending') return idea.status === 'PendingApproval';
      return true;
    })
    .sort((a, b) => sortBy === 'newest'
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold font-manrope tracking-tight text-on-surface mb-1">Approval Queue</h1>
          <p className="text-sm text-on-surface-variant font-medium">Review and accelerate high-impact innovation requests.</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" style={{ fontSize: '18px' }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="pl-10 pr-5 py-2.5 bg-surface-container-low border-none rounded-full w-64 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-surface-container-lowest p-5 rounded-lg shadow-[0px_12px_24px_rgba(0,101,146,0.04)] relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-sky-50 rounded-full group-hover:scale-110 transition-transform duration-500 opacity-50" />
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Pending Review</p>
          <h3 className="text-3xl font-black font-manrope text-on-surface">{ideas.length}</h3>
          <div className="mt-3 flex items-center text-primary font-bold text-xs">
            {ideas.length > 0 ? (
              <><span>Action Required</span><span className="material-symbols-outlined ml-1 text-xs">arrow_forward</span></>
            ) : (
              <><span className="text-on-surface-variant">Queue Clear</span><span className="material-symbols-outlined ml-1 text-xs text-on-surface-variant">check_circle</span></>
            )}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-lg shadow-[0px_12px_24px_rgba(0,101,146,0.04)] relative overflow-hidden group">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Awaiting Info</p>
          <h3 className="text-3xl font-black font-manrope text-on-surface">0</h3>
          <div className="mt-3 flex items-center text-on-surface-variant font-bold text-xs">
            <span>Queue Clear</span>
            <span className="material-symbols-outlined ml-1 text-xs">check_circle</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-lg shadow-[0px_12px_24px_rgba(0,101,146,0.04)] relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-green-50 rounded-full group-hover:scale-110 transition-transform duration-500 opacity-50" />
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Approved This Month</p>
          <h3 className="text-3xl font-black font-manrope text-on-surface">—</h3>
          <div className="mt-3 flex items-center font-bold text-xs">
            <span className="text-emerald-600">Tracking</span>
          </div>
        </div>
      </div>

      {/* List header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold font-manrope tracking-tight text-on-surface">Innovation Backlog</h4>
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
          <span>Sorted by</span>
          <button onClick={() => setSortBy(s => s === 'newest' ? 'oldest' : 'newest')} className="flex items-center gap-1 text-on-surface font-bold">
            {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Ideas list */}
      {filteredIdeas.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
          <span className="material-symbols-outlined text-5xl mb-3">inbox</span>
          <p className="text-base font-bold">No ideas pending review</p>
          <p className="text-sm">You're all caught up with your queries.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIdeas.map(idea => {
            const catIcon = CATEGORY_ICONS[idea.category] || 'lightbulb';
            const catColor = CATEGORY_COLORS[idea.category] || 'bg-slate-50 text-slate-600';

            return (
              <div key={idea._id || idea.id}
                className="bg-surface-container-lowest p-5 rounded-lg shadow-[0px_12px_24px_rgba(0,101,146,0.04)] hover:shadow-[0px_12px_24px_rgba(0,101,146,0.08)] transition-all flex items-center gap-5">
                {/* Category icon */}
                <div className={`w-12 h-12 rounded-xl ${catColor.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined text-2xl ${catColor.split(' ')[1]}`}>{catIcon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold font-manrope text-on-surface truncate">{idea.title}</h3>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-tight flex-shrink-0 ${
                      idea.projectType === 'FullProduct' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {idea.projectType === 'FullProduct' ? 'Full Product' : 'POC'}
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[9px] font-bold rounded-full uppercase tracking-tight flex-shrink-0">
                      {idea.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      {idea.submittedByName && (
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                          {idea.submittedByName[0]?.toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium">{idea.submittedByName || idea.projectOwner || 'Unknown'}</span>
                    </div>
                    <span className="text-on-surface-variant/30">•</span>
                    <span>{timeAgo(idea.createdAt)}</span>
                  </div>

                  <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed line-clamp-2">{idea.description}</p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  <button onClick={() => openApproveForm(idea)}
                    className="px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md shadow-sky-100 hover:scale-105 transition-all">
                    Review & Approve
                  </button>
                  <button onClick={() => openRejectForm(idea)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
