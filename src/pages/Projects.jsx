import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, InProgress, Completed

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant">Loading projects...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Projects</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track active innovation projects — Kanban boards, chat, requirements</p>
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['InProgress', 'In Progress'], ['Completed', 'Completed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === val ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-2xl font-bold font-manrope text-primary">{projects.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total Projects</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-2xl font-bold font-manrope text-amber-600">{projects.filter(p => p.status === 'InProgress').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">In Progress</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-2xl font-bold font-manrope text-emerald-600">{projects.filter(p => p.status === 'Completed').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Completed</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
          <p className="text-2xl font-bold font-manrope text-blue-600">{projects.reduce((s, p) => s + (p.taskCount || 0), 0)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total Tasks</p>
        </div>
      </div>

      {/* Project Cards */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">folder_open</span>
          <p className="text-on-surface-variant">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(project => {
            const progress = project.taskCount > 0 ? Math.round((project.tasksDone / project.taskCount) * 100) : 0;
            const hoursProgress = project.estimatedHours > 0 ? Math.round((project.totalHours / project.estimatedHours) * 100) : 0;

            return (
              <div key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-surface-container-lowest rounded-2xl p-6 hover:shadow-tonal-md transition-all duration-200 cursor-pointer group">

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ring-1 ring-inset ${
                        project.status === 'InProgress' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                        project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        'bg-blue-50 text-blue-700 ring-blue-600/20'
                      }`}>{project.status === 'InProgress' ? 'In Progress' : project.status}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold">{project.size}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold">{project.projectType === 'FullProduct' ? 'Full Product' : 'POC'}</span>
                    </div>
                    <h3 className="text-base font-bold font-manrope text-on-surface group-hover:text-primary transition-colors">{project.title}</h3>
                  </div>
                </div>

                {/* Task Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                    <span>Tasks: {project.tasksDone}/{project.taskCount}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Hours */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                    <span>Hours: {project.totalHours}/{project.estimatedHours || '?'}</span>
                    <span>{hoursProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, hoursProgress)}%` }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((m, i) => (
                      m.avatar ? (
                        <img key={i} src={m.avatar} className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" alt="" />
                      ) : (
                        <div key={i} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-primary">
                          {(m.name || '?')[0]}
                        </div>
                      )
                    ))}
                    {project.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">chat</span>
                      {project.messageCount}
                    </span>
                    {project.expectedDelivery && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">event</span>
                        {new Date(project.expectedDelivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
