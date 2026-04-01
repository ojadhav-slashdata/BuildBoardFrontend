import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';

const roles = ['Employee', 'Manager', 'Admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((list) => list.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch {
      alert('Failed to update role.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-heading text-2xl mb-8">User Management</h1>
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-on-surface-variant/60 bg-surface-container-low">
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  {u.pictureUrl ? (
                    <img src={u.pictureUrl} className="h-9 w-9 rounded-xl" referrerPolicy="no-referrer" alt="" />
                  ) : (
                    <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{(u.name || '?')[0]}</span>
                  )}
                  <span className="font-medium text-on-surface">{u.name}</span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{u.email}</td>
                <td className="px-6 py-4">
                  <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} className="input-field py-1.5 px-3 text-sm">
                    {roles.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-on-surface-variant/60">
                  {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
