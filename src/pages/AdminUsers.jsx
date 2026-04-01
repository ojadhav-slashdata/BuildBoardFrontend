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
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 flex items-center gap-3">
                  {u.pictureUrl ? (
                    <img src={u.pictureUrl} className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" alt="" />
                  ) : (
                    <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{(u.name || '?')[0]}</span>
                  )}
                  <span className="font-medium text-gray-800">{u.name}</span>
                </td>
                <td className="px-5 py-3 text-gray-600">{u.email}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  >
                    {roles.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3 text-gray-500">
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
