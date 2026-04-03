import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../axiosConfig';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'space_dashboard' },
  { key: 'board', label: 'Board', icon: 'view_kanban' },
  { key: 'chat', label: 'Chat', icon: 'forum' },
  { key: 'requirements', label: 'Requirements', icon: 'checklist' },
  { key: 'resources', label: 'Resources & Links', icon: 'link' },
];

const KANBAN_COLUMNS = [
  { key: 'todo', label: 'Todo', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  { key: 'in_review', label: 'In Review', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
  { key: 'done', label: 'Done', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
];

const CHANNELS = ['General', 'Requirements', 'Design', 'Blockers'];

const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-700 ring-red-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  low: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  critical: 'bg-red-100 text-red-800 ring-red-700/30',
};

const REQ_PRIORITY_STYLES = {
  must_have: 'bg-red-50 text-red-700 ring-red-600/20',
  should_have: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  nice_to_have: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

const REQ_STATUS_STYLES = {
  open: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-50 text-amber-700',
  done: 'bg-emerald-50 text-emerald-700',
  blocked: 'bg-red-50 text-red-700',
};

const LINK_TYPE_ICONS = {
  figma: { emoji: '\uD83C\uDFA8', label: 'Figma', badge: 'bg-purple-50 text-purple-700' },
  github: { emoji: '\uD83D\uDCBB', label: 'GitHub', badge: 'bg-slate-100 text-slate-700' },
  docs: { emoji: '\uD83D\uDCC4', label: 'Docs', badge: 'bg-blue-50 text-blue-700' },
  prototype: { emoji: '\uD83D\uDD17', label: 'Prototype', badge: 'bg-emerald-50 text-emerald-700' },
  design: { emoji: '\uD83D\uDD8C\uFE0F', label: 'Design', badge: 'bg-pink-50 text-pink-700' },
  other: { emoji: '\uD83D\uDCCE', label: 'Other', badge: 'bg-surface-container-high text-on-surface-variant' },
};

const MESSAGE_BORDER = {
  blocker: 'border-l-4 border-l-red-400 bg-red-50/40',
  requirement: 'border-l-4 border-l-blue-400 bg-blue-50/40',
  design_link: 'border-l-4 border-l-purple-400 bg-purple-50/40',
  default: '',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function avatarUrl(user) {
  if (!user) return null;
  if (user.avatar) return user.avatar;
  if (user.photoURL) return user.photoURL;
  return null;
}

function initials(user) {
  if (!user) return '?';
  const name = user.displayName || user.name || user.email || '';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function AvatarCircle({ user, size = 'w-8 h-8', textSize = 'text-xs' }) {
  const url = avatarUrl(user);
  if (url) {
    return <img src={url} alt="" className={`${size} rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div className={`${size} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold ${textSize} ring-2 ring-white`}>
      {initials(user)}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Top-level state
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Board state
  const [editingTask, setEditingTask] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Chat state
  const [activeChannel, setActiveChannel] = useState('General');
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [msgType, setMsgType] = useState('default');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef(null);

  // Requirements state
  const [newReq, setNewReq] = useState({ title: '', description: '', priority: 'should_have' });
  const [showReqForm, setShowReqForm] = useState(false);

  // Links state
  const [newLink, setNewLink] = useState({ title: '', url: '', linkType: 'other' });
  const [showLinkForm, setShowLinkForm] = useState(false);

  // Hours logging
  const [showLogHours, setShowLogHours] = useState(false);
  const [logHoursVal, setLogHoursVal] = useState(2);
  const [logNotes, setLogNotes] = useState('');

  // Project status actions
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to load project', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeTab !== 'chat') return;
    setLoadingMessages(true);
    api.get(`/projects/${id}/messages?channel=${activeChannel}`)
      .then(res => setMessages(res.data?.messages || res.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [activeChannel, activeTab, id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Board actions ────────────────────────────────────────────────────────

  const tasks = project?.tasks || [];

  const tasksByColumn = (col) => tasks.filter(t => (t.status || 'todo') === col);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    setTaskSubmitting(true);
    try {
      await api.post(`/projects/${id}/tasks`, {
        ...newTask,
        status: addingToColumn,
      });
      setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '' });
      setAddingToColumn(null);
      await fetchProject();
    } catch (err) {
      console.error('Failed to create task', err);
    }
    setTaskSubmitting(false);
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await api.patch(`/projects/${id}/tasks/${taskId}`, updates);
      await fetchProject();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      setEditingTask(null);
      await fetchProject();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const moveTask = (task, direction) => {
    const colKeys = KANBAN_COLUMNS.map(c => c.key);
    const currentIdx = colKeys.indexOf(task.status || 'todo');
    const nextIdx = currentIdx + direction;
    if (nextIdx < 0 || nextIdx >= colKeys.length) return;
    handleUpdateTask(task._id, { status: colKeys[nextIdx] });
  };

  // ─── Chat actions ─────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    try {
      await api.post(`/projects/${id}/messages`, {
        content: msgInput,
        channel: activeChannel,
        messageType: msgType,
      });
      setMsgInput('');
      setMsgType('default');
      const res = await api.get(`/projects/${id}/messages?channel=${activeChannel}`);
      setMessages(res.data?.messages || res.data || []);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // ─── Requirements actions ─────────────────────────────────────────────────

  const requirements = project?.requirements || [];
  const doneReqs = requirements.filter(r => r.status === 'done').length;

  const handleAddReq = async () => {
    if (!newReq.title.trim()) return;
    try {
      await api.post(`/projects/${id}/requirements`, newReq);
      setNewReq({ title: '', description: '', priority: 'should_have' });
      setShowReqForm(false);
      await fetchProject();
    } catch (err) {
      console.error('Failed to add requirement', err);
    }
  };

  const cycleReqStatus = async (req) => {
    const order = ['open', 'in_progress', 'done', 'blocked'];
    const currentIdx = order.indexOf(req.status || 'open');
    const next = order[(currentIdx + 1) % order.length];
    try {
      await api.patch(`/projects/${id}/requirements/${req._id}`, { status: next });
      await fetchProject();
    } catch (err) {
      console.error('Failed to update requirement', err);
    }
  };

  // ─── Links actions ────────────────────────────────────────────────────────

  const links = project?.links || [];

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    try {
      await api.post(`/projects/${id}/links`, newLink);
      setNewLink({ title: '', url: '', linkType: 'other' });
      setShowLinkForm(false);
      await fetchProject();
    } catch (err) {
      console.error('Failed to add link', err);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await api.delete(`/projects/${id}/links/${linkId}`);
      await fetchProject();
    } catch (err) {
      console.error('Failed to delete link', err);
    }
  };

  // ─── Hours ────────────────────────────────────────────────────────────────

  const handleLogHours = async () => {
    try {
      await api.post(`/ideas/${project?.ideaId || id}/timelogs`, {
        hours: Number(logHoursVal),
        notes: logNotes,
      });
      setShowLogHours(false);
      setLogHoursVal(2);
      setLogNotes('');
      await fetchProject();
    } catch (err) {
      console.error('Failed to log hours', err);
    }
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sendForReview = async () => {
    setStatusSubmitting(true);
    try {
      await api.patch(`/ideas/${id}/send-for-review`);
      await fetchProject();
    } catch { alert('Failed to send for review'); }
    setStatusSubmitting(false);
  };

  const markCompleted = async () => {
    if (!window.confirm('Mark this project as completed? Points will be awarded to the team.')) return;
    setStatusSubmitting(true);
    try {
      await api.patch(`/ideas/${id}/complete`);
      await fetchProject();
    } catch { alert('Failed to mark as completed'); }
    setStatusSubmitting(false);
  };

  if (!project) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">folder_off</span>
        <p className="text-on-surface-variant/60">Project not found</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go back</button>
      </div>
    );
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const team = project.members || project.teamMembers || project.team || [];
  const totalHours = project.totalHoursLogged || project.timeLogs?.reduce((s, l) => s + l.hours, 0) || 0;
  const estimatedHours = project.estimatedHours || project.budgetHours || 100;
  const hoursPercent = Math.min(100, Math.round((totalHours / estimatedHours) * 100));

  const deliveryDate = project.expectedDeliveryDate || project.deadline;
  const daysLeft = deliveryDate ? Math.max(0, Math.ceil((new Date(deliveryDate) - Date.now()) / 86400000)) : null;

  const statusColor = {
    InProgress: 'bg-amber-50 text-amber-700',
    BiddingOpen: 'bg-green-50 text-green-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    PendingApproval: 'bg-blue-50 text-blue-700',
    PendingReview: 'bg-purple-50 text-purple-700',
  };

  const isAdmin = user?.role === 'Admin';
  const isMember = (project.members || []).some(m => m.id === user?.id);
  const isBidWinner = project.bidWinnerId === user?.id;
  const canManageProject = isBidWinner || isAdmin || isMember;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 min-h-[calc(100vh-5rem)]">
      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* ── Hero Project Header ─────────────────────────────────────── */}
        <div className="mb-6">
          <button onClick={() => navigate('/projects')} className="text-sm text-primary hover:underline mb-3 inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            All Projects
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">{project.title || project.name}</h1>

          {/* Project Hero Card */}
          <div className="rounded-3xl p-6 mb-4" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #3525cd 100%)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {project.status && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white/15 text-white/90 backdrop-blur">
                      {project.status === 'InProgress' ? '● In Progress' : project.status === 'PendingReview' ? '● Pending Review' : project.status === 'Completed' ? '✓ Completed' : project.status}
                    </span>
                  )}
                  {project.projectType && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white/10 text-white/70">
                      {project.projectType === 'FullProduct' ? 'Full Product' : 'POC'}
                    </span>
                  )}
                  {project.size && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white/10 text-white/70">{project.size}</span>
                  )}
                  {project.complexity && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white/10 text-white/70">{project.complexity}</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold font-manrope tracking-tight text-white mb-1">{project.title || project.name}</h1>
                <p className="text-sm text-white/60 max-w-xl">{project.description?.slice(0, 150)}{project.description?.length > 150 ? '...' : ''}</p>
              </div>
              {/* Team avatars */}
              <div className="flex -space-x-2 shrink-0">
                {(project.members || team).slice(0, 5).map((m, i) => (
                  m.avatar ? (
                    <img key={i} src={m.avatar} className="w-9 h-9 rounded-full border-2 border-[#1E1B4B]" alt="" />
                  ) : (
                    <div key={i} className="w-9 h-9 rounded-full bg-white/20 border-2 border-[#1E1B4B] flex items-center justify-center text-xs font-bold text-white">
                      {(m.name || '?')[0]}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold font-manrope text-white">{tasks.length}</p>
                <p className="text-[10px] text-white/50">Total Tasks</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold font-manrope text-emerald-300">{tasks.filter(t => t.status === 'done').length}</p>
                <p className="text-[10px] text-white/50">Completed</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold font-manrope text-amber-300">{Math.round(totalHours)}h</p>
                <p className="text-[10px] text-white/50">Hours Logged</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className={`text-xl font-bold font-manrope ${daysLeft !== null && daysLeft <= 3 ? 'text-red-300' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-300' : 'text-blue-300'}`}>
                  {daysLeft !== null ? `${daysLeft}d` : '—'}
                </p>
                <p className="text-[10px] text-white/50">Days Left</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Task Progress</span>
                <span>{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Action Buttons */}
        {project.status === 'InProgress' && canManageProject && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Ready for review?</p>
              <p className="text-xs text-primary/70">Send this project to admin for final review</p>
            </div>
            <button onClick={sendForReview} disabled={statusSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-all disabled:opacity-50">
              {statusSubmitting ? 'Sending...' : 'Send for Review'}
            </button>
          </div>
        )}

        {project.status === 'PendingReview' && isAdmin && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">Project submitted for review</p>
              <p className="text-xs text-emerald-600">Review the work and mark as completed to award points to the team</p>
            </div>
            <button onClick={markCompleted} disabled={statusSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-all disabled:opacity-50">
              {statusSubmitting ? 'Completing...' : 'Mark as Completed & Award Points'}
            </button>
          </div>
        )}

        {project.status === 'PendingReview' && !isAdmin && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-medium text-purple-800">Awaiting admin review</p>
            <p className="text-xs text-purple-600">Your project has been submitted and is pending review by admin</p>
          </div>
        )}

        {project.status === 'Completed' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <div>
              <p className="text-sm font-medium text-emerald-800">Project completed!</p>
              <p className="text-xs text-emerald-600">Points have been awarded to all team members</p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-surface-container-lowest shadow-tonal text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={activeTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : undefined}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Health Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: 'task_alt', label: 'Tasks Done', value: `${tasks.filter(t=>t.status==='done').length}/${tasks.length}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: 'schedule', label: 'Hours Used', value: `${Math.round(totalHours)}/${estimatedHours}h`, color: hoursPercent > 90 ? 'text-red-600' : 'text-primary', bg: hoursPercent > 90 ? 'bg-red-50' : 'bg-primary/5' },
                { icon: 'checklist', label: 'Requirements', value: `${doneReqs}/${requirements.length}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: 'link', label: 'Resources', value: `${links.length}`, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((m, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                    <span className={`material-symbols-outlined ${m.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold font-manrope ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Two columns: Activity + Team */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-surface-container-lowest rounded-2xl p-5">
                <h3 className="font-manrope font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {(project.timeLogs || []).slice(0, 5).map((log, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-outline-variant/10 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface"><span className="font-medium">{log.userName || 'Team member'}</span> logged <span className="font-bold text-primary">{log.hours}h</span></p>
                        {log.description && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{log.description}</p>}
                        <p className="text-[10px] text-on-surface-variant/50 mt-0.5">{log.logged_date || timeAgo(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {(!project.timeLogs || project.timeLogs.length === 0) && (
                    <p className="text-sm text-on-surface-variant/50 text-center py-4">No activity yet — start logging hours!</p>
                  )}
                </div>
              </div>

              {/* Task Breakdown */}
              <div className="bg-surface-container-lowest rounded-2xl p-5">
                <h3 className="font-manrope font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>view_kanban</span>
                  Task Breakdown
                </h3>
                <div className="space-y-3">
                  {KANBAN_COLUMNS.map(col => {
                    const count = tasks.filter(t => t.status === col.key).length;
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                    return (
                      <div key={col.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-on-surface">{col.label}</span>
                          <span className="text-on-surface-variant">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${col.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick navigate */}
                <button onClick={() => setActiveTab('board')} className="w-full mt-4 py-2.5 text-center text-xs font-semibold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Open Kanban Board
                </button>
              </div>
            </div>

            {/* Project Details + Milestones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest rounded-2xl p-5">
                <h3 className="font-manrope font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  Project Details
                </h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    ['Category', project.category],
                    ['Project Owner', project.projectOwner || project.project_owner_name],
                    ['Size', project.size],
                    ['Complexity', project.complexity],
                    ['Type', project.projectType === 'FullProduct' ? 'Full Product' : 'POC'],
                    ['Delivery', deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-outline-variant/5 last:border-0">
                      <span className="text-on-surface-variant">{k}</span>
                      <span className="font-medium text-on-surface">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements Summary */}
              <div className="bg-surface-container-lowest rounded-2xl p-5">
                <h3 className="font-manrope font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                  Requirements Progress
                </h3>
                {requirements.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/50 text-center py-4">No requirements defined yet</p>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                      <span>{doneReqs} of {requirements.length} complete</span>
                      <span>{requirements.length > 0 ? Math.round((doneReqs / requirements.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${requirements.length > 0 ? (doneReqs / requirements.length) * 100 : 0}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      {requirements.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <span className={`material-symbols-outlined text-sm ${r.status === 'done' ? 'text-emerald-500' : r.status === 'blocked' ? 'text-red-500' : 'text-on-surface-variant/40'}`}
                            style={{ fontVariationSettings: r.status === 'done' ? "'FILL' 1" : "'FILL' 0" }}>
                            {r.status === 'done' ? 'check_circle' : r.status === 'blocked' ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span className={`text-sm ${r.status === 'done' ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{r.title}</span>
                        </div>
                      ))}
                      {requirements.length > 5 && (
                        <button onClick={() => setActiveTab('requirements')} className="text-xs text-primary font-medium mt-1">
                          +{requirements.length - 5} more →
                        </button>
                      )}
                    </div>
                  </>
                )}
                <button onClick={() => setActiveTab('requirements')} className="w-full mt-4 py-2.5 text-center text-xs font-semibold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                  Manage Requirements
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'board' && <BoardTab
          tasks={tasks}
          tasksByColumn={tasksByColumn}
          team={team}
          addingToColumn={addingToColumn}
          setAddingToColumn={setAddingToColumn}
          newTask={newTask}
          setNewTask={setNewTask}
          handleCreateTask={handleCreateTask}
          taskSubmitting={taskSubmitting}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          handleUpdateTask={handleUpdateTask}
          handleDeleteTask={handleDeleteTask}
          moveTask={moveTask}
        />}

        {activeTab === 'chat' && <ChatTab
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          messages={messages}
          loadingMessages={loadingMessages}
          msgInput={msgInput}
          setMsgInput={setMsgInput}
          msgType={msgType}
          setMsgType={setMsgType}
          sendMessage={sendMessage}
          chatEndRef={chatEndRef}
          user={user}
        />}

        {activeTab === 'requirements' && <RequirementsTab
          requirements={requirements}
          doneReqs={doneReqs}
          showReqForm={showReqForm}
          setShowReqForm={setShowReqForm}
          newReq={newReq}
          setNewReq={setNewReq}
          handleAddReq={handleAddReq}
          cycleReqStatus={cycleReqStatus}
        />}

        {activeTab === 'resources' && <ResourcesTab
          links={links}
          showLinkForm={showLinkForm}
          setShowLinkForm={setShowLinkForm}
          newLink={newLink}
          setNewLink={setNewLink}
          handleAddLink={handleAddLink}
          handleDeleteLink={handleDeleteLink}
        />}
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 space-y-4 hidden lg:block">
        {/* Project info */}
        <div className="surface-card-elevated p-5">
          <h3 className="font-manrope font-bold text-sm text-on-surface mb-3">Project Info</h3>
          <div className="space-y-3 text-sm">
            <InfoRow icon="info" label="Status" value={project.status || 'N/A'} />
            <InfoRow icon="straighten" label="Size" value={project.size || 'N/A'} />
            <InfoRow icon="category" label="Type" value={project.projectType || 'N/A'} />
            <InfoRow icon="label" label="Category" value={project.category || 'N/A'} />
            {deliveryDate && (
              <InfoRow icon="calendar_today" label="Delivery" value={new Date(deliveryDate).toLocaleDateString()} />
            )}
          </div>
        </div>

        {/* Team */}
        <div className="surface-card-elevated p-5">
          <h3 className="font-manrope font-bold text-sm text-on-surface mb-3">Team ({team.length})</h3>
          {team.length === 0 && <p className="text-xs text-on-surface-variant/60">No team members yet</p>}
          <div className="space-y-2.5">
            {team.map((m, i) => (
              <div key={m._id || m.id || i} className="flex items-center gap-2.5">
                <AvatarCircle user={m} size="w-7 h-7" textSize="text-[10px]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{m.displayName || m.name || m.email}</p>
                  {m.role && <p className="text-[11px] text-on-surface-variant/60">{m.role}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hours burndown */}
        <div className="surface-card-elevated p-5">
          <h3 className="font-manrope font-bold text-sm text-on-surface mb-3">Hours</h3>
          <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
            <span>{totalHours} logged</span>
            <span>{estimatedHours} estimated</span>
          </div>
          <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${hoursPercent > 90 ? 'bg-red-400' : hoursPercent > 70 ? 'bg-amber-400' : 'bg-primary'}`}
              style={{ width: `${hoursPercent}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant/60 mt-1.5">{hoursPercent}% of budget used</p>
        </div>

        {/* Delivery countdown */}
        {daysLeft !== null && (
          <div className="surface-card-elevated p-5">
            <h3 className="font-manrope font-bold text-sm text-on-surface mb-2">Delivery Countdown</h3>
            <div className="text-center">
              <span className={`text-3xl font-bold font-manrope ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-primary'}`}>
                {daysLeft}
              </span>
              <p className="text-xs text-on-surface-variant mt-1">days remaining</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="surface-card-elevated p-5">
          <h3 className="font-manrope font-bold text-sm text-on-surface mb-3">Quick Actions</h3>
          <button
            onClick={() => setShowLogHours(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            Log Hours
          </button>
        </div>

        {/* Log Hours Modal */}
        {showLogHours && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogHours(false)}>
            <div className="surface-card-elevated p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="font-manrope font-bold text-lg text-on-surface mb-4">Log Hours</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={logHoursVal}
                    onChange={e => setLogHoursVal(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">Notes</label>
                  <textarea
                    value={logNotes}
                    onChange={e => setLogNotes(e.target.value)}
                    className="input-field w-full resize-none"
                    rows={3}
                    placeholder="What did you work on?"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleLogHours} className="btn-primary flex-1">Submit</button>
                  <button onClick={() => setShowLogHours(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">{icon}</span>
      <span className="text-on-surface-variant/70 w-16 shrink-0">{label}</span>
      <span className="font-medium text-on-surface truncate">{value}</span>
    </div>
  );
}

// ─── Board Tab ────────────────────────────────────────────────────────────────

function BoardTab({
  tasks, tasksByColumn, team,
  addingToColumn, setAddingToColumn, newTask, setNewTask,
  handleCreateTask, taskSubmitting,
  editingTask, setEditingTask, handleUpdateTask, handleDeleteTask, moveTask,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col, colIdx) => {
          const columnTasks = tasksByColumn(col.key);
          return (
            <div key={col.key} className="bg-surface-container-lowest/50 rounded-2xl p-3 min-h-[300px]">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h4 className="font-manrope font-bold text-sm text-on-surface">{col.label}</h4>
                  <span className="text-xs text-on-surface-variant/50 bg-surface-container-low rounded-full px-2 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingToColumn(addingToColumn === col.key ? null : col.key)}
                  className="w-6 h-6 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center transition-colors"
                  title="Add task"
                >
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">add</span>
                </button>
              </div>

              {/* Inline add form */}
              {addingToColumn === col.key && (
                <div className="surface-card p-3 mb-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="input-field w-full text-sm"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    className="input-field w-full text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      className="input-field text-xs flex-1"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <select
                      value={newTask.assignedTo}
                      onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      className="input-field text-xs flex-1"
                    >
                      <option value="">Unassigned</option>
                      {team.map(m => (
                        <option key={m._id || m.id} value={m._id || m.id}>
                          {m.displayName || m.name || m.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTask}
                      disabled={taskSubmitting || !newTask.title.trim()}
                      className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                    >
                      {taskSubmitting ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => setAddingToColumn(null)}
                      className="btn-ghost text-xs py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Task cards */}
              <div className="space-y-2.5">
                {columnTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    team={team}
                    colIdx={colIdx}
                    totalCols={KANBAN_COLUMNS.length}
                    onEdit={() => setEditingTask(editingTask?._id === task._id ? null : task)}
                    moveTask={moveTask}
                    isEditing={editingTask?._id === task._id}
                    handleUpdateTask={handleUpdateTask}
                    handleDeleteTask={handleDeleteTask}
                  />
                ))}
              </div>

              {columnTasks.length === 0 && addingToColumn !== col.key && (
                <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant/30">
                  <span className="material-symbols-outlined text-3xl mb-1">inbox</span>
                  <p className="text-xs">No tasks</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, team, colIdx, totalCols, onEdit, moveTask, isEditing, handleUpdateTask, handleDeleteTask }) {
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    assignedTo: task.assignedTo?._id || task.assignedTo || '',
    status: task.status || 'todo',
  });

  const assignee = team.find(m => (m._id || m.id) === (task.assignedTo?._id || task.assignedTo));

  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="surface-card-elevated p-3 group hover:shadow-tonal-lg transition-all duration-200 cursor-pointer">
      {/* Card top */}
      <div onClick={onEdit}>
        <div className="flex items-start justify-between mb-2">
          <h5 className="text-sm font-medium text-on-surface leading-snug flex-1 mr-2">{task.title}</h5>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap ${priorityStyle}`}>
            {task.priority || 'medium'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assignee && <AvatarCircle user={assignee} size="w-5 h-5" textSize="text-[8px]" />}
            {assignee && <span className="text-[11px] text-on-surface-variant truncate max-w-[100px]">{assignee.displayName || assignee.name}</span>}
          </div>
          {task.dueDate && (
            <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Move arrows */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-low opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); moveTask(task, -1); }}
          disabled={colIdx === 0}
          className="w-6 h-6 rounded-md bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center disabled:opacity-20 transition-colors"
          title="Move left"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_left</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); moveTask(task, 1); }}
          disabled={colIdx === totalCols - 1}
          className="w-6 h-6 rounded-md bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center disabled:opacity-20 transition-colors"
          title="Move right"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>

      {/* Expanded edit form */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-surface-container-low space-y-2" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="input-field w-full text-sm"
          />
          <textarea
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="input-field w-full text-sm resize-none"
            rows={2}
            placeholder="Description"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={editForm.priority}
              onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
              className="input-field text-xs"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value })}
              className="input-field text-xs"
            >
              {KANBAN_COLUMNS.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <select
            value={editForm.assignedTo}
            onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })}
            className="input-field text-xs w-full"
          >
            <option value="">Unassigned</option>
            {team.map(m => (
              <option key={m._id || m.id} value={m._id || m.id}>
                {m.displayName || m.name || m.email}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateTask(task._id, editForm)}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Save
            </button>
            <button
              onClick={() => handleDeleteTask(task._id)}
              className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ activeChannel, setActiveChannel, messages, loadingMessages, msgInput, setMsgInput, msgType, setMsgType, sendMessage, chatEndRef, user }) {
  return (
    <div className="surface-card-elevated flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
      {/* Channel tabs */}
      <div className="flex gap-1 p-2 border-b border-surface-container-low">
        {CHANNELS.map(ch => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeChannel === ch
                ? ch === 'Blockers' ? 'bg-red-50 text-red-700' : 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {ch === 'Blockers' && <span className="mr-1">!</span>}
            {ch}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMessages && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}
        {!loadingMessages && messages.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-4xl mb-2 block">chat_bubble_outline</span>
            <p className="text-sm">No messages in #{activeChannel} yet</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={msg._id || i}
            className={`rounded-xl p-3 ${MESSAGE_BORDER[msg.messageType] || MESSAGE_BORDER.default}`}
          >
            <div className="flex items-start gap-2.5">
              <AvatarCircle user={msg.sender || msg.user} size="w-8 h-8" textSize="text-xs" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-on-surface">
                    {msg.sender?.displayName || msg.sender?.name || msg.user?.displayName || 'User'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/50">
                    {timeAgo(msg.createdAt || msg.timestamp)}
                  </span>
                  {msg.messageType && msg.messageType !== 'default' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      msg.messageType === 'blocker' ? 'bg-red-100 text-red-700' :
                      msg.messageType === 'requirement' ? 'bg-blue-100 text-blue-700' :
                      msg.messageType === 'design_link' ? 'bg-purple-100 text-purple-700' :
                      'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {msg.messageType}
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed whitespace-pre-wrap">{msg.content || msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t border-surface-container-low">
        <div className="flex gap-2 mb-2">
          {['default', 'blocker', 'requirement', 'design_link'].map(t => (
            <button
              key={t}
              onClick={() => setMsgType(t)}
              className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                msgType === t
                  ? t === 'blocker' ? 'bg-red-100 text-red-700' :
                    t === 'requirement' ? 'bg-blue-100 text-blue-700' :
                    t === 'design_link' ? 'bg-purple-100 text-purple-700' :
                    'bg-primary/10 text-primary'
                  : 'text-on-surface-variant/60 hover:bg-surface-container-low'
              }`}
            >
              {t === 'default' ? 'Message' : t === 'design_link' ? 'Design' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="input-field flex-1"
            placeholder={`Message #${activeChannel}...`}
          />
          <button
            onClick={sendMessage}
            disabled={!msgInput.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Requirements Tab ─────────────────────────────────────────────────────────

function RequirementsTab({ requirements, doneReqs, showReqForm, setShowReqForm, newReq, setNewReq, handleAddReq, cycleReqStatus }) {
  const total = requirements.length;
  const progressPercent = total > 0 ? Math.round((doneReqs / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="surface-card-elevated p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-manrope font-bold text-sm text-on-surface">Progress</h3>
          <span className="text-sm font-medium text-primary">{doneReqs}/{total} done</span>
        </div>
        <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-on-surface-variant/60 mt-1.5">{progressPercent}% complete</p>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => setShowReqForm(!showReqForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Requirement
        </button>
      </div>

      {/* Add form */}
      {showReqForm && (
        <div className="surface-card-elevated p-5 space-y-3">
          <input
            type="text"
            placeholder="Requirement title"
            value={newReq.title}
            onChange={e => setNewReq({ ...newReq, title: e.target.value })}
            className="input-field w-full"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newReq.description}
            onChange={e => setNewReq({ ...newReq, description: e.target.value })}
            className="input-field w-full resize-none"
            rows={2}
          />
          <select
            value={newReq.priority}
            onChange={e => setNewReq({ ...newReq, priority: e.target.value })}
            className="input-field w-full"
          >
            <option value="must_have">Must Have</option>
            <option value="should_have">Should Have</option>
            <option value="nice_to_have">Nice to Have</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleAddReq} disabled={!newReq.title.trim()} className="btn-primary text-sm disabled:opacity-50">Add</button>
            <button onClick={() => setShowReqForm(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Requirement list */}
      <div className="space-y-2">
        {requirements.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-4xl mb-2 block">checklist</span>
            <p className="text-sm">No requirements yet</p>
          </div>
        )}
        {requirements.map((req, i) => {
          const status = req.status || 'open';
          const priority = req.priority || 'should_have';
          return (
            <div
              key={req._id || i}
              onClick={() => cycleReqStatus(req)}
              className="surface-card-elevated p-4 flex items-start gap-3 cursor-pointer hover:shadow-tonal-lg transition-all group"
            >
              {/* Status checkbox */}
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                status === 'done' ? 'bg-emerald-100' :
                status === 'in_progress' ? 'bg-amber-100' :
                status === 'blocked' ? 'bg-red-100' :
                'bg-surface-container-low'
              }`}>
                <span className="material-symbols-outlined text-[16px]" style={status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {status === 'done' ? 'check_circle' :
                   status === 'in_progress' ? 'pending' :
                   status === 'blocked' ? 'block' :
                   'radio_button_unchecked'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${status === 'done' ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                    {req.title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ring-inset ${REQ_PRIORITY_STYLES[priority] || ''}`}>
                    {priority.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${REQ_STATUS_STYLES[status] || ''}`}>
                    {status.replace(/_/g, ' ')}
                  </span>
                </div>
                {req.description && (
                  <p className="text-xs text-on-surface-variant/60 mt-1 leading-relaxed">{req.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

function ResourcesTab({ links, showLinkForm, setShowLinkForm, newLink, setNewLink, handleAddLink, handleDeleteLink }) {
  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => setShowLinkForm(!showLinkForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          Add Link
        </button>
      </div>

      {/* Add form */}
      {showLinkForm && (
        <div className="surface-card-elevated p-5 space-y-3">
          <input
            type="text"
            placeholder="Link title"
            value={newLink.title}
            onChange={e => setNewLink({ ...newLink, title: e.target.value })}
            className="input-field w-full"
            autoFocus
          />
          <input
            type="url"
            placeholder="https://..."
            value={newLink.url}
            onChange={e => setNewLink({ ...newLink, url: e.target.value })}
            className="input-field w-full"
          />
          <select
            value={newLink.linkType}
            onChange={e => setNewLink({ ...newLink, linkType: e.target.value })}
            className="input-field w-full"
          >
            {Object.entries(LINK_TYPE_ICONS).map(([key, val]) => (
              <option key={key} value={key}>{val.emoji} {val.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAddLink} disabled={!newLink.title.trim() || !newLink.url.trim()} className="btn-primary text-sm disabled:opacity-50">Add</button>
            <button onClick={() => setShowLinkForm(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Links grid */}
      {links.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant/40">
          <span className="material-symbols-outlined text-4xl mb-2 block">link_off</span>
          <p className="text-sm">No links added yet</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((link, i) => {
          const typeInfo = LINK_TYPE_ICONS[link.linkType] || LINK_TYPE_ICONS.other;
          return (
            <div key={link._id || i} className="surface-card-elevated p-4 group hover:shadow-tonal-lg transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{typeInfo.emoji}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteLink(link._id)}
                    className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[14px] text-red-400">delete</span>
                  </button>
                </div>
              </div>
              <h4 className="text-sm font-medium text-on-surface mb-1 truncate">{link.title}</h4>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate block mb-2"
              >
                {link.url}
              </a>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeInfo.badge}`}>
                  {typeInfo.label}
                </span>
                {(link.addedBy?.displayName || link.addedBy?.name) && (
                  <span className="text-[10px] text-on-surface-variant/50">
                    by {link.addedBy.displayName || link.addedBy.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
