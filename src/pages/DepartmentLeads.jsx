import { useState, useEffect } from 'react';
import api from '../axiosConfig';

const CATEGORIES = ['Tech', 'HR', 'Finance', 'Operations', 'Other'];

export default function DepartmentLeads() {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/department-leads'),
      api.get('/users'),
    ]).then(([leadsRes, usersRes]) => {
      setLeads(leadsRes.data || []);
      setUsers(usersRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getLeadForCategory = (cat) => leads.find(l => l.category === cat);

  const handleAssign = async (category) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await api.put(`/department-leads/${category}`, { leadUserId: selectedUser });
      setLeads(prev => {
        const filtered = prev.filter(l => l.category !== category);
        return [...filtered, res.data];
      });
      setEditing(null);
      setSelectedUser('');
      setSearch('');
    } catch { alert('Failed to assign lead'); }
    setSaving(false);
  };

  const handleRemove = async (category) => {
    try {
      await api.delete(`/department-leads/${category}`);
      setLeads(prev => prev.filter(l => l.category !== category));
    } catch { alert('Failed to remove'); }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20 text-on-surface-variant">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-manrope tracking-tight text-on-surface">Department Leads</h1>
        <p className="text-sm text-on-surface-variant mt-1">Assign a lead approver for each idea category. When employees submit ideas, the lead is auto-assigned as the approver.</p>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const lead = getLeadForCategory(cat);
          const isEditing = editing === cat;

          return (
            <div key={cat} className="bg-surface-container-lowest rounded-2xl p-5 hover:shadow-tonal-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Category icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {cat === 'Tech' ? 'code' : cat === 'HR' ? 'group' : cat === 'Finance' ? 'account_balance' : cat === 'Operations' ? 'settings' : 'category'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-manrope font-bold text-on-surface">{cat}</h3>
                    {lead ? (
                      <div className="flex items-center gap-2 mt-1">
                        {lead.leadAvatar ? (
                          <img src={lead.leadAvatar} className="w-5 h-5 rounded-full" alt="" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                            {(lead.leadName || '?')[0]}
                          </div>
                        )}
                        <span className="text-sm text-on-surface-variant">{lead.leadName}</span>
                        <span className="text-xs text-on-surface-variant/50">{lead.leadEmail}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant/40 mt-1">No lead assigned</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lead && !isEditing && (
                    <button onClick={() => handleRemove(cat)}
                      className="p-2 rounded-xl hover:bg-error/10 text-on-surface-variant/40 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                  <button onClick={() => { setEditing(isEditing ? null : cat); setSelectedUser(''); setSearch(''); }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isEditing ? 'bg-surface-container-high text-on-surface-variant' :
                      lead ? 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high' :
                      'bg-primary text-on-primary'
                    }`}>
                    {isEditing ? 'Cancel' : lead ? 'Change' : 'Assign Lead'}
                  </button>
                </div>
              </div>

              {/* Edit mode */}
              {isEditing && (
                <div className="mt-4 pt-4 border-t border-outline-variant/10">
                  <label className="text-xs font-semibold text-on-surface-variant block mb-2">Select user to assign as lead for {cat}</label>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="input-field w-full mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredUsers.slice(0, 10).map(u => (
                      <button key={u.id} onClick={() => setSelectedUser(u.id)}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                          selectedUser === u.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-surface-container-low'
                        }`}>
                        {u.pictureUrl ? (
                          <img src={u.pictureUrl} className="w-8 h-8 rounded-full" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface">{u.name}</p>
                          <p className="text-xs text-on-surface-variant/60">{u.email}</p>
                        </div>
                        {selectedUser === u.id && (
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedUser && (
                    <button onClick={() => handleAssign(cat)} disabled={saving}
                      className="btn-primary w-full mt-3 disabled:opacity-50">
                      {saving ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
